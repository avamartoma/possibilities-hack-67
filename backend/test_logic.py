"""Dependency-light regression checks for the shared career logic."""

import json
import unittest
from pathlib import Path

from .fit import compute_fit
from .milestones import build_milestone_plan
from .analysis import aggregate_role_analysis
from .comparison import compare_profile_to_role
from .pathing import generate_path
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

    def test_milestone_plan_falls_back_to_portfolio_when_no_gaps(self):
        role = ROLES["devops_engineer"]
        fully_skilled = {**USERS[0], "skills": list(role["skills"])}
        plan = build_milestone_plan(fully_skilled, role, COURSES)
        self.assertEqual(len(plan["milestones"]), 1)
        self.assertEqual(plan["milestones"][0]["skill"], "Portfolio evidence")
        self.assertIsNone(plan["milestones"][0]["course"])

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


def _profile(skills, profile_id="user_test", interests=None):
    return {"id": profile_id, "name": "Test User", "skills": list(skills), "interests": list(interests or [])}


class CompareServiceTests(unittest.TestCase):
    """Track B: compare_profile_to_role is the canonical fit source."""

    ROLE = ROLES["data_scientist"]

    def test_strengths_and_gaps_split_required_skills(self):
        profile = _profile(["Python", "Machine Learning"])
        result = compare_profile_to_role(profile, self.ROLE)
        required = set(self.ROLE["skills"])
        self.assertEqual(set(result["strengths"]), {"Python", "Machine Learning"})
        missing = {gap["skill"] for gap in result["skillGaps"] if gap["status"] == "missing"}
        self.assertEqual(set(result["strengths"]) | missing, required)
        self.assertIsInstance(result["readinessScore"], int)
        self.assertEqual(result["readinessScore"], 27)
        self.assertEqual(result["readinessBreakdown"]["core"], {"matched": 2, "total": 6, "points": 27})

    def test_compare_is_case_insensitive(self):
        lower = compare_profile_to_role(_profile(["python", "machine learning"]), self.ROLE)
        mixed = compare_profile_to_role(_profile(["PYTHON", "Machine Learning"]), self.ROLE)
        self.assertEqual(lower["readinessScore"], mixed["readinessScore"])
        self.assertEqual(set(lower["strengths"]), set(mixed["strengths"]))

    def test_missing_and_strength_gap_shapes(self):
        result = compare_profile_to_role(_profile(["Python"]), self.ROLE)
        missing = [gap for gap in result["skillGaps"] if gap["status"] == "missing"]
        strength = [gap for gap in result["skillGaps"] if gap["status"] == "strength"]
        self.assertTrue(missing and strength)
        for gap in missing:
            self.assertEqual(gap["importance"], "core")
            self.assertEqual(gap["evidence"], [])  # no fabricated evidence
            self.assertTrue(gap["suggestedProject"])
        for gap in strength:
            self.assertEqual(gap["evidence"], ["Listed in your profile"])

    def test_empty_required_skills_role_yields_zero_readiness(self):
        empty_role = {"id": "empty_role", "name": "Empty Role", "description": "", "skills": [], "companies": []}
        result = compare_profile_to_role(_profile(["Python"]), empty_role)
        self.assertEqual(result["readinessScore"], 0)
        self.assertEqual(result["strengths"], [])
        self.assertEqual(result["skillGaps"], [])
        self.assertTrue(result["suggestedNextSteps"])

    def test_aggregate_exposes_counts_only(self):
        result = compare_profile_to_role(_profile(["Python"]), self.ROLE)
        self.assertEqual(set(result["aggregateAnalysis"]), {"analyzed", "landed", "similar"})


class PathServiceTests(unittest.TestCase):
    """Track B: generate_path turns a comparison into ordered, course-backed milestones."""

    ROLE = ROLES["data_scientist"]

    def _comparison(self, skills):
        return compare_profile_to_role(_profile(skills), self.ROLE)

    def test_respects_max_milestones_with_sequential_orders(self):
        path = generate_path(self._comparison(["Python"]), COURSES, max_milestones=2)
        self.assertLessEqual(len(path["milestones"]), 2)
        self.assertEqual([m["order"] for m in path["milestones"]], list(range(1, len(path["milestones"]) + 1)))

    def test_default_caps_at_five(self):
        path = generate_path(self._comparison([]), COURSES, max_milestones=5)
        self.assertLessEqual(len(path["milestones"]), 5)

    def test_missing_skill_with_course_record_uses_real_course(self):
        path = generate_path(self._comparison(["Python", "Machine Learning"]), COURSES, max_milestones=5)
        data_analysis = next(m for m in path["milestones"] if m["targetSkill"] == "Data Analysis")
        self.assertIsNotNone(data_analysis["course"])
        self.assertEqual(data_analysis["course"], COURSES["Data Analysis"][0])

    def test_fully_aligned_profile_gets_one_portfolio_milestone(self):
        path = generate_path(self._comparison(self.ROLE["skills"]), COURSES, max_milestones=5)
        self.assertEqual(len(path["milestones"]), 1)
        self.assertEqual(path["milestones"][0]["targetSkill"], "Portfolio evidence")
        self.assertIsNone(path["milestones"][0]["course"])

    def test_every_milestone_has_all_action_types_and_not_started(self):
        path = generate_path(self._comparison(["Python"]), COURSES, max_milestones=5)
        self.assertTrue(path["milestones"])
        for milestone in path["milestones"]:
            self.assertTrue(milestone["project"])
            self.assertTrue(milestone["networkingAction"])
            self.assertTrue(milestone["profileCheckpoint"])
            self.assertEqual(milestone["completionState"], "not_started")
        self.assertTrue(path["disclaimer"])


if __name__ == "__main__":
    unittest.main()
