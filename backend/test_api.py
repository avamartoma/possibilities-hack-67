"""API-level regression checks for the v2 contracts.

Run after installing backend/requirements.txt.
"""

import unittest

from fastapi import HTTPException

from .main import get_fit, get_milestones, get_profile, get_role_detail, post_compare, post_explain, post_path_generate, post_recommend, post_role_search
from .schemas import CompareRequest, ExplainRequest, PathGenerateRequest, RecommendRequest, RoleSearchRequest


class CareerApiTests(unittest.TestCase):
    def test_profile_is_normalized_and_unknown_is_404(self):
        response = get_profile("user_5329")
        self.assertEqual(set(response), {"id", "name", "headline", "currentStatus", "skills", "experience", "education", "interests", "savedGoals", "location"})
        with self.assertRaises(HTTPException) as error:
            get_profile("nope")
        self.assertEqual(error.exception.status_code, 404)

    def test_empty_search_returns_catalog_and_data_search_finds_data_scientist(self):
        all_roles = post_role_search(RoleSearchRequest()).get("roles")
        data_roles = post_role_search(RoleSearchRequest(query="data"))["roles"]
        self.assertEqual(len(all_roles), 10)
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


if __name__ == "__main__":
    unittest.main()
