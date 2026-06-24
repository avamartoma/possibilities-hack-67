"""Dependency-light regression checks for the shared career logic."""

import json
import unittest
from pathlib import Path

from .fit import compute_fit
from .milestones import build_milestone_plan
from .analysis import aggregate_role_analysis
from .profile_source import normalize_sample_user, resolve_profile
from .roles import explain_role, search_roles

NORMALIZED_FIELDS = {"id", "name", "headline", "currentStatus", "skills", "experience", "education", "interests", "savedGoals", "location"}


DATA_DIR = Path(__file__).parent / "data"
ROLES = json.loads((DATA_DIR / "roleSkills.json").read_text())
USERS = json.loads((DATA_DIR / "users.json").read_text())
COURSES = json.loads((DATA_DIR / "courses.json").read_text())


class CareerLogicTests(unittest.TestCase):
    def test_fit_returns_gap_lists_and_percentage(self):
        result = compute_fit(USERS[0]["skills"], ROLES["devops_engineer"])
        self.assertGreaterEqual(result["percent"], 0)
        self.assertLessEqual(result["percent"], 100)
        self.assertEqual(set(result["haveSkills"]) | set(result["missingSkills"]), set(ROLES["devops_engineer"]["skills"]))

    def test_milestone_plan_is_course_backed(self):
        plan = build_milestone_plan(USERS[0], ROLES["devops_engineer"], COURSES)
        self.assertTrue(plan["milestones"])
        self.assertEqual(plan["role"]["id"], "devops_engineer")
        self.assertTrue(all(step["actions"] for step in plan["milestones"]))

    def test_aggregate_analysis_never_exposes_profiles(self):
        analysis = aggregate_role_analysis("DevOps Engineer", USERS[0]["skills"])
        self.assertEqual(set(analysis), {"analyzed", "landed", "similar"})
        self.assertGreater(analysis["analyzed"], 0)


class ProfileSourceTests(unittest.TestCase):
    def test_seed_user_resolves_with_all_normalized_fields(self):
        profile = resolve_profile("user_5329")
        self.assertIsNotNone(profile)
        self.assertEqual(set(profile), NORMALIZED_FIELDS)

    def test_canonical_user_2340_resolves_from_sample_data(self):
        profile = resolve_profile("user_2340")
        self.assertIsNotNone(profile)
        self.assertEqual(set(profile), NORMALIZED_FIELDS)
        self.assertEqual(profile["id"], "user_2340")
        self.assertEqual(profile["name"], "Bob Smith")
        self.assertIn("AWS", profile["skills"])
        self.assertEqual(profile["location"], "Austin, TX")
        self.assertTrue(profile["experience"])
        self.assertTrue(profile["education"])

    def test_unknown_user_resolves_to_none(self):
        self.assertIsNone(resolve_profile("user_does_not_exist"))

    def test_resolution_is_immutable_across_calls(self):
        first = resolve_profile("user_2340")
        first["skills"].append("Injected")
        first["name"] = "Mutated"
        second = resolve_profile("user_2340")
        self.assertNotIn("Injected", second["skills"])
        self.assertEqual(second["name"], "Bob Smith")

    def test_sample_adapter_uses_deterministic_fallbacks_for_sparse_record(self):
        sparse = {"id": "user_x", "skills": ["Python"]}
        normalized = normalize_sample_user(sparse)
        self.assertEqual(set(normalized), NORMALIZED_FIELDS)
        self.assertEqual(normalized["name"], "Demo user")
        self.assertTrue(normalized["headline"])
        self.assertTrue(normalized["currentStatus"])
        self.assertEqual(normalized["experience"], [])
        self.assertEqual(normalized["education"], [])
        self.assertIsNone(normalized["location"])

    def test_sample_adapter_maps_rich_record_fields(self):
        record = {
            "id": "user_y", "name": "Ada", "headline": "Engineer",
            "skills": ["AWS"], "current_location": "NYC", "open_to_work": True,
            "open_to_roles": ["Software Engineer"],
            "school_history": [{"school_name": "MIT", "degree": "CS", "graduation_year": 2020}],
            "experience": [{"title": "SWE", "company": "Acme", "start": "2020", "end": "Present", "skills": ["AWS"]}],
        }
        normalized = normalize_sample_user(record)
        self.assertEqual(normalized["headline"], "Engineer")
        self.assertEqual(normalized["location"], "NYC")
        self.assertEqual(normalized["currentStatus"], "Open to work")
        self.assertIn("Software Engineer", normalized["interests"])
        self.assertEqual(normalized["education"][0]["field"], "CS")
        self.assertEqual(normalized["experience"][0]["title"], "SWE")

    def test_sample_adapter_status_falls_back_to_latest_title(self):
        record = {"id": "user_z", "skills": [], "experience": [{"title": "Analyst"}]}
        normalized = normalize_sample_user(record)
        self.assertEqual(normalized["currentStatus"], "Analyst")


class RoleSearchAndExplainTests(unittest.TestCase):
    def test_category_filter_only_returns_matching_category(self):
        target = ROLES["data_scientist"]["category"]
        results = search_roles(ROLES, categories=[target])
        self.assertTrue(results)
        self.assertTrue(all(role["category"] == target for role in results))

    def test_skills_filter_excludes_roles_without_overlap(self):
        results = search_roles(ROLES, skills=["NoSuchSkillAtAll"])
        self.assertEqual(results, [])

    def test_explain_without_profile_is_generic(self):
        explanation = explain_role(ROLES["data_scientist"], None, ROLES)
        self.assertTrue(explanation["whyItMayFit"])
        self.assertTrue(explanation["dayToDay"])

    def test_explain_with_matching_profile_cites_strengths(self):
        skills = ROLES["data_scientist"]["skills"][:1]
        profile = {"skills": skills}
        explanation = explain_role(ROLES["data_scientist"], profile, ROLES)
        self.assertIn(skills[0], explanation["whyItMayFit"])

    def test_explain_with_unmatched_profile_is_a_stretch(self):
        profile = {"skills": ["Totally Unrelated Skill"]}
        explanation = explain_role(ROLES["data_scientist"], profile, ROLES)
        self.assertIn("stretch", explanation["whyItMayFit"].lower())


if __name__ == "__main__":
    unittest.main()
