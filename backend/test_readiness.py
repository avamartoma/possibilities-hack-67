"""W2 (v3): RED specs for the honest weighted readiness model."""

import unittest

from .readiness import compute_readiness


def role(core, supporting=None):
    return {"coreSkills": list(core), "supportingSkills": list(supporting or [])}


class ComputeReadinessTests(unittest.TestCase):
    def test_all_core_match_is_100(self):
        self.assertEqual(compute_readiness(["Python", "AWS"], role(["Python", "AWS"])), 100)

    def test_no_match_is_zero(self):
        self.assertEqual(compute_readiness(["Cooking"], role(["Python", "AWS"])), 0)

    def test_half_core_lands_in_the_middle_band(self):
        score = compute_readiness(["Python"], role(["Python", "AWS"]))
        self.assertGreaterEqual(score, 40)
        self.assertLessEqual(score, 60)

    def test_core_weighted_higher_than_supporting(self):
        # Same single-skill overlap, but one is a core skill and one is supporting.
        core_hit = compute_readiness(["Python"], role(["Python", "AWS"], ["DevOps", "Cloud"]))
        support_hit = compute_readiness(["DevOps"], role(["Python", "AWS"], ["DevOps", "Cloud"]))
        self.assertGreater(core_hit, support_hit)

    def test_case_and_whitespace_insensitive(self):
        base = compute_readiness(["Python", "AWS"], role(["Python", "AWS"]))
        varied = compute_readiness(["  python ", "aws"], role(["Python", "AWS"]))
        self.assertEqual(base, varied)

    def test_synonyms_fold_to_canonical_skill(self):
        # "Comp Sci" should count as "Computer".
        self.assertEqual(compute_readiness(["Comp Sci"], role(["Computer"])), 100)

    def test_role_without_supporting_is_not_penalized(self):
        # A full core match with no supporting skills should still reach 100.
        self.assertEqual(compute_readiness(["Python", "AWS"], role(["Python", "AWS"], [])), 100)

    def test_empty_required_skills_is_zero_without_crashing(self):
        self.assertEqual(compute_readiness(["Python"], role([], [])), 0)

    def test_clamped_and_integer(self):
        score = compute_readiness(["Python", "AWS", "DevOps"], role(["Python", "AWS"], ["DevOps"]))
        self.assertIsInstance(score, int)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)

    def test_monotonic_adding_a_matching_skill_never_lowers_readiness(self):
        r = role(["Python", "AWS"], ["DevOps"])
        base = compute_readiness(["Python"], r)
        more = compute_readiness(["Python", "DevOps"], r)
        even_more = compute_readiness(["Python", "DevOps", "AWS"], r)
        self.assertGreaterEqual(more, base)
        self.assertGreaterEqual(even_more, more)

    def test_falls_back_to_required_skills_when_untagged(self):
        # Legacy role with only `skills` (no core/supporting tags) → treated as core.
        legacy = {"skills": ["Python", "AWS"]}
        self.assertEqual(compute_readiness(["Python", "AWS"], legacy), 100)


class ReadinessWiringTests(unittest.TestCase):
    """compare + recommend use the weighted model (regression: monotonic)."""

    def _role(self):
        return {
            "id": "ds", "name": "Data Scientist", "description": "d", "companies": [],
            "skills": ["Python", "Machine Learning", "AWS"],
            "coreSkills": ["Python", "Machine Learning"],
            "supportingSkills": ["AWS"],
        }

    def test_compare_uses_weighted_readiness(self):
        from .comparison import compare_profile_to_role
        from .readiness import compute_profile_readiness
        role = self._role()
        profile = {"id": "u", "name": "U", "skills": ["Python"], "interests": []}
        result = compare_profile_to_role(profile, role)
        expected, breakdown = compute_profile_readiness(profile, role)
        self.assertEqual(result["readinessScore"], expected)
        self.assertEqual(result["readinessBreakdown"], breakdown)

    def test_evidence_adds_points_only_for_listed_matched_skills(self):
        from .readiness import compute_profile_readiness
        role = self._role()
        profile = {"skills": ["Python", "AWS"], "experience": [{"skills": ["Python"], "title": "", "description": ""}], "education": []}
        score, breakdown = compute_profile_readiness(profile, role)
        self.assertEqual(breakdown["core"], {"matched": 1, "total": 2, "points": 32})
        self.assertEqual(breakdown["supporting"], {"matched": 1, "total": 1, "points": 20})
        self.assertEqual(breakdown["evidence"], {"matched": 1, "total": 3, "points": 5})
        self.assertEqual(score, 57)

    def test_no_supporting_skills_redistributes_to_core_and_evidence(self):
        from .readiness import compute_profile_readiness
        profile = {"skills": ["Python"], "experience": [{"skills": ["Python"]}], "education": []}
        score, breakdown = compute_profile_readiness(profile, role(["Python", "AWS"], []))
        self.assertEqual(breakdown["core"]["points"], 40)
        self.assertEqual(breakdown["evidence"]["points"], 10)
        self.assertEqual(score, 50)

    def test_compare_readiness_is_monotonic(self):
        from .comparison import compare_profile_to_role
        role = self._role()
        base = compare_profile_to_role({"id": "u", "name": "U", "skills": ["Python"], "interests": []}, role)["readinessScore"]
        more = compare_profile_to_role({"id": "u", "name": "U", "skills": ["Python", "Machine Learning"], "interests": []}, role)["readinessScore"]
        self.assertGreaterEqual(more, base)

    def test_recommend_carries_weighted_readiness(self):
        from .comparison import recommend_roles
        from .readiness import compute_readiness
        roles = {"ds": self._role()}
        profile = {"id": "u", "name": "U", "skills": ["Python"], "interests": []}
        recs = recommend_roles(profile, roles, [], "", 5)
        self.assertEqual(recs[0]["readinessScore"], compute_readiness(profile["skills"], roles["ds"]))


if __name__ == "__main__":
    unittest.main()
