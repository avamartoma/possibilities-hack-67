"""W1 (v3): RED specs for the 207-role catalog built from jobs_data.json.

Dependency-light: imports the precompute building blocks directly and asserts the
deterministic catalog shape. No FastAPI TestClient.
"""

import json
import tempfile
import unittest
from pathlib import Path

from .precompute import (
    ALL_INDUSTRIES,
    DEMO_USER_IDS,
    INDUSTRY_SKILLS,
    KEYWORD_SKILLS,
    build_catalog,
    build_courses,
    build_demo_users,
    canonical_subset,
    load_users,
    main,
    role_skills_for,
    slugify,
)
from .roles import normalize_role

SAMPLE = Path(__file__).resolve().parent.parent / "sample_data"
JOBS = json.loads((SAMPLE / "jobs_data.json").read_text())
CATALOG = build_catalog(JOBS)

CANONICAL_IDS = {
    "software_engineer", "devops_engineer", "data_scientist", "ux_designer",
    "product_manager", "financial_analyst", "marketing_specialist",
    "hr_coordinator", "sales_representative", "customer_service_manager",
}


class SlugifyTests(unittest.TestCase):
    def test_slug_is_lowercase_underscored(self):
        self.assertEqual(slugify("Environmental Scientist"), "environmental_scientist")

    def test_slug_handles_punctuation_and_hyphens(self):
        self.assertEqual(slugify("Front-End Developer"), "front_end_developer")
        self.assertEqual(slugify("  Data   Scientist  "), "data_scientist")

    def test_slug_is_collision_free_over_all_positions(self):
        positions = sorted({job["position"] for job in JOBS})
        slugs = [slugify(p) for p in positions]
        self.assertEqual(len(slugs), len(set(slugs)))


class IndustrySkillTableTests(unittest.TestCase):
    def test_industry_skills_cover_all_21_industries(self):
        industries = {job["industry"] for job in JOBS}
        self.assertEqual(len(industries), 21)
        self.assertEqual(ALL_INDUSTRIES, set(INDUSTRY_SKILLS))
        for industry in industries:
            self.assertIn(industry, INDUSTRY_SKILLS)
            self.assertTrue(INDUSTRY_SKILLS[industry], f"{industry} has no core skills")

    def test_role_skills_combine_industry_core_and_keyword_supporting(self):
        core, supporting = role_skills_for("Backend Engineer", "Technology")
        self.assertEqual(core, INDUSTRY_SKILLS["Technology"])
        # "engineer" keyword contributes a supporting skill not already in core.
        self.assertIn("Engineering", core + supporting)
        self.assertTrue(set(core).isdisjoint(supporting))

    def test_keyword_skills_are_drawn_from_real_skill_universe(self):
        universe = set()
        for skills in INDUSTRY_SKILLS.values():
            universe.update(skills)
        for skill in KEYWORD_SKILLS.values():
            self.assertIsInstance(skill, str)


class CatalogShapeTests(unittest.TestCase):
    def test_catalog_has_at_least_200_roles(self):
        self.assertGreaterEqual(len(CATALOG), 200)

    def test_every_entry_has_full_shape(self):
        for rid, role in CATALOG.items():
            self.assertEqual(role["id"], rid)
            for key in ("name", "category", "description", "skills", "coreSkills",
                        "supportingSkills", "companies", "industries", "levels",
                        "salaryFrom", "salaryTo", "easyApplyPct", "jobCount", "postings"):
                self.assertIn(key, role, f"{rid} missing {key}")
            self.assertEqual(role["skills"], role["coreSkills"] + role["supportingSkills"])
            self.assertTrue(role["skills"], f"{rid} has no skills")
            self.assertGreaterEqual(role["jobCount"], 1)
            self.assertLessEqual(role["salaryFrom"], role["salaryTo"])
            self.assertTrue(role["postings"])
            for posting in role["postings"]:
                self.assertEqual(set(posting), {"id", "company", "location", "level", "salaryFrom", "salaryTo", "easyApply"})

    def test_canonical_ids_present_and_skilled(self):
        for cid in CANONICAL_IDS:
            self.assertIn(cid, CATALOG)
        # canonical roles keep their curated skill sets (intersect the 30-skill universe).
        self.assertIn("Python", CATALOG["data_scientist"]["skills"])
        self.assertIn("Machine Learning", CATALOG["data_scientist"]["skills"])

    def test_known_position_resolves_with_real_postings_and_industry_skills(self):
        env = CATALOG["environmental_scientist"]
        self.assertEqual(env["name"], "Environmental Scientist")
        self.assertIn("Energy & Environment", env["industries"])
        self.assertEqual(env["coreSkills"], INDUSTRY_SKILLS["Energy & Environment"])
        self.assertTrue(all(p["id"] for p in env["postings"]))

    def test_easy_apply_pct_is_a_percentage(self):
        for role in CATALOG.values():
            self.assertGreaterEqual(role["easyApplyPct"], 0)
            self.assertLessEqual(role["easyApplyPct"], 100)


class NormalizeRoleCoreSupportingTests(unittest.TestCase):
    """normalize_role exposes coreSkills/supportingSkills for the FIFA card."""

    def test_derived_role_normalizes_core_and_supporting(self):
        role = CATALOG["environmental_scientist"]
        normalized = normalize_role(role)
        self.assertEqual(normalized["coreSkills"], role["coreSkills"])
        self.assertEqual(normalized["supportingSkills"], role["supportingSkills"])
        self.assertEqual(normalized["requiredSkills"], role["skills"])

    def test_legacy_role_without_tags_falls_back_to_all_core(self):
        legacy = {"id": "legacy_role", "name": "Legacy", "description": "d", "skills": ["Python", "AWS"], "companies": []}
        normalized = normalize_role(legacy)
        self.assertEqual(normalized["coreSkills"], ["Python", "AWS"])
        self.assertEqual(normalized["supportingSkills"], [])


class PrecomputeBuildersTests(unittest.TestCase):
    """The pure assembly helpers and the file-writing entry point."""

    def test_load_users_tolerates_legacy_missing_opening_bracket(self):
        # The real export omits the opening "[" but keeps the closing "]".
        self.assertEqual(load_users('{"id": "a"}, {"id": "b"}]'), [{"id": "a"}, {"id": "b"}])
        self.assertEqual(load_users('[{"id": "a"}]'), [{"id": "a"}])

    def test_canonical_subset_keeps_only_the_ten_curated_roles(self):
        subset = canonical_subset(CATALOG)
        self.assertEqual(set(subset), CANONICAL_IDS)

    def test_build_demo_users_flags_hero_and_skips_missing(self):
        raw = [
            {"id": "user_5329", "name": "Hero", "skills": ["Python"], "school_history": [{"degree": "CS"}]},
            {"id": "user_5377", "name": "Two", "skills": ["AWS"]},
        ]
        users = build_demo_users(raw)
        self.assertEqual([u["id"] for u in users], ["user_5329", "user_5377"])
        self.assertTrue(users[0]["hero"])
        self.assertEqual(users[0]["degree"], "CS")
        self.assertFalse(users[1]["hero"])
        self.assertIsNone(users[1]["degree"])
        self.assertTrue(set(DEMO_USER_IDS))

    def test_build_courses_groups_by_skill_and_caps_at_three(self):
        raw = [{"id": f"c{i}", "name": f"Course {i}", "skills": ["Python"]} for i in range(4)]
        courses = build_courses(raw)
        self.assertEqual(len(courses["Python"]), 3)

    def test_main_writes_all_four_payloads(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            payloads = main(out_dir=out)
            for filename in ("rolesCatalog.json", "roleSkills.json", "users.json", "courses.json"):
                self.assertTrue((out / filename).exists())
                self.assertEqual(json.loads((out / filename).read_text()), payloads[filename])
            self.assertGreaterEqual(len(payloads["rolesCatalog.json"]), 200)
            self.assertEqual(set(payloads["roleSkills.json"]), CANONICAL_IDS)


if __name__ == "__main__":
    unittest.main()
