"""API-level regression checks for the v2 contracts.

Run after installing backend/requirements.txt.
"""

import unittest

from fastapi import HTTPException

from .main import get_courses, get_fit, get_milestones, get_profile, get_role_detail, get_roles, get_users, health, post_compare, post_explain, post_path_generate, post_recommend, post_role_search
from .schemas import CompareRequest, ExplainRequest, PathGenerateRequest, RecommendRequest, RoleSearchRequest


class CareerApiTests(unittest.TestCase):
    def test_profile_is_normalized_and_unknown_is_404(self):
        response = get_profile("user_5329")
        self.assertEqual(set(response), {"id", "name", "headline", "currentStatus", "skills", "experience", "education", "interests", "savedGoals", "location"})
        with self.assertRaises(HTTPException) as error:
            get_profile("nope")
        self.assertEqual(error.exception.status_code, 404)

    def test_empty_search_returns_catalog_and_data_search_finds_data_scientist(self):
        # v3: search paginates over the full 207-role catalog (capped by limit).
        first_page = post_role_search(RoleSearchRequest(limit=50)).get("roles")
        data_roles = post_role_search(RoleSearchRequest(query="data", limit=50))["roles"]
        self.assertEqual(len(first_page), 50)
        self.assertIn("data_scientist", [role["id"] for role in data_roles])

    def test_role_detail_and_explanation_are_complete_without_an_llm(self):
        detail = get_role_detail("data_scientist")
        explanation = post_explain(ExplainRequest(roleId="data_scientist", userId="user_5329"))
        self.assertIn("requiredSkills", detail)
        self.assertIn("postings", detail)
        self.assertTrue(explanation["dayToDay"])
        self.assertTrue(explanation["whyItMayFit"])

    def test_recommend_compare_and_path(self):
        recommendations = post_recommend(RecommendRequest(userId="user_5329", interests=["data"], limit=3))["recommendations"]
        self.assertEqual(len(recommendations), 3)
        self.assertTrue(all(item["scoreReasons"] for item in recommendations))

        baseline = post_compare(CompareRequest(userId="user_5329", roleId="data_scientist"))
        overridden = post_compare(CompareRequest(userId="user_5329", roleId="data_scientist", profileOverride={"skills": ["Python", "Machine Learning", "Data Analysis"]}))
        self.assertNotEqual(baseline["readinessScore"], overridden["readinessScore"])

        path = post_path_generate(PathGenerateRequest(userId="user_5329", roleId="data_scientist", maxMilestones=5))
        self.assertLessEqual(len(path["milestones"]), 5)
        self.assertEqual([item["order"] for item in path["milestones"]], list(range(1, len(path["milestones"]) + 1)))

    def test_compatibility_routes_remain_available(self):
        self.assertIn("percent", get_fit("user_5329", "data_scientist"))
        self.assertIn("milestones", get_milestones("user_5329", "data_scientist"))

    def test_canonical_user_2340_profile_resolves(self):
        response = get_profile("user_2340")
        self.assertEqual(set(response), {"id", "name", "headline", "currentStatus", "skills", "experience", "education", "interests", "savedGoals", "location"})
        self.assertEqual(response["name"], "Bob Smith")
        self.assertIn("AWS", response["skills"])

    def test_user_2340_works_for_compare_and_path(self):
        comparison = post_compare(CompareRequest(userId="user_2340", roleId="data_scientist"))
        self.assertIn("readinessScore", comparison)
        path = post_path_generate(PathGenerateRequest(userId="user_2340", roleId="data_scientist", maxMilestones=3))
        self.assertLessEqual(len(path["milestones"]), 3)

    def test_override_does_not_mutate_canonical_baseline(self):
        baseline = get_profile("user_2340")["skills"]
        post_compare(CompareRequest(userId="user_2340", roleId="data_scientist", profileOverride={"skills": ["Totally", "Different", "Skills"]}))
        after = get_profile("user_2340")["skills"]
        self.assertEqual(baseline, after)

    def test_legacy_collection_routes_return_seed_data(self):
        self.assertEqual(health()["status"], "ok")
        self.assertTrue(get_roles())
        self.assertTrue(get_users())
        self.assertTrue(get_courses())

    def test_legacy_fit_and_milestones_reject_unknown_ids(self):
        for bad in (("nope", "data_scientist"), ("user_5329", "nope")):
            with self.assertRaises(HTTPException) as fit_error:
                get_fit(*bad)
            self.assertEqual(fit_error.exception.status_code, 404)
            with self.assertRaises(HTTPException) as ms_error:
                get_milestones(*bad)
            self.assertEqual(ms_error.exception.status_code, 404)

    def test_unknown_role_detail_is_404(self):
        with self.assertRaises(HTTPException) as error:
            get_role_detail("no_such_role")
        self.assertEqual(error.exception.status_code, 404)

    def test_compare_unknown_role_is_404(self):
        with self.assertRaises(HTTPException) as error:
            post_compare(CompareRequest(userId="user_2340", roleId="no_such_role"))
        self.assertEqual(error.exception.status_code, 404)

    def test_recommendations_carry_integer_readiness_score(self):
        recommendations = post_recommend(RecommendRequest(userId="user_2340", query="data", limit=3))["recommendations"]
        self.assertTrue(recommendations)
        for item in recommendations:
            self.assertIn("readinessScore", item)
            self.assertIsInstance(item["readinessScore"], int)
            self.assertGreaterEqual(item["readinessScore"], 0)
            self.assertLessEqual(item["readinessScore"], 100)


class CatalogApiTests(unittest.TestCase):
    """W1 (v3): the API serves the full 207-role catalog with legacy ids intact."""

    def test_get_roles_exposes_full_catalog(self):
        roles = get_roles()
        self.assertGreaterEqual(len(roles), 200)
        ids = {role["id"] for role in roles}
        self.assertIn("data_scientist", ids)
        self.assertIn("environmental_scientist", ids)

    def test_derived_role_detail_carries_core_and_supporting_skills(self):
        detail = get_role_detail("environmental_scientist")
        self.assertEqual(detail["name"], "Environmental Scientist")
        self.assertTrue(detail["requiredSkills"])
        self.assertIn("postings", detail)

    def test_legacy_fit_and_milestones_still_resolve_canonical_ids(self):
        self.assertIn("percent", get_fit("user_5329", "data_scientist"))
        self.assertIn("milestones", get_milestones("user_5329", "data_scientist"))


class CompareAndPathHandlerTests(unittest.TestCase):
    """Track B: override fit dynamics and the Path generation contract shape."""

    def test_override_adds_strengths_removes_gaps_and_raises_readiness(self):
        baseline = post_compare(CompareRequest(userId="user_5329", roleId="data_scientist"))
        overridden = post_compare(
            CompareRequest(
                userId="user_5329",
                roleId="data_scientist",
                profileOverride={"skills": baseline["profile"]["skills"] + ["Python", "Machine Learning", "Data Analysis"]},
            )
        )
        self.assertGreater(overridden["readinessScore"], baseline["readinessScore"])
        self.assertGreaterEqual(len(overridden["strengths"]), len(baseline["strengths"]))
        baseline_missing = {g["skill"] for g in baseline["skillGaps"] if g["status"] == "missing"}
        overridden_missing = {g["skill"] for g in overridden["skillGaps"] if g["status"] == "missing"}
        self.assertTrue(overridden_missing < baseline_missing or not overridden_missing)

    def test_path_generate_handler_returns_full_contract(self):
        path = post_path_generate(PathGenerateRequest(userId="user_5329", roleId="data_scientist", maxMilestones=3))
        self.assertEqual(
            set(path),
            {"profileId", "role", "readinessScore", "readinessBreakdown", "startingStrengths", "skillGaps", "milestones", "generatedAt", "disclaimer"},
        )
        self.assertLessEqual(len(path["milestones"]), 3)

    def test_path_generate_unknown_role_is_404(self):
        with self.assertRaises(HTTPException) as error:
            post_path_generate(PathGenerateRequest(userId="user_5329", roleId="no_such_role"))
        self.assertEqual(error.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
