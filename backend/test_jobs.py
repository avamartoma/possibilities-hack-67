"""W3 (v3): RED specs for top-applicant job ranking."""

import json
import unittest
from pathlib import Path

from fastapi import HTTPException

from .jobs import TOP_APPLICANT_THRESHOLD, rank_top_applicant_jobs
from .main import post_top_applicant_jobs
from .schemas import TopApplicantRequest

DATA_DIR = Path(__file__).parent / "data"
ROLES = json.loads((DATA_DIR / "rolesCatalog.json").read_text())


def profile(skills):
    return {"id": "u", "name": "U", "skills": list(skills), "interests": []}


class RankTopApplicantJobsTests(unittest.TestCase):
    def test_jobs_sorted_by_descending_score_with_roleid_and_flag(self):
        jobs = rank_top_applicant_jobs(profile(["Python", "AWS", "DevOps"]), ROLES, limit=25)
        self.assertTrue(jobs)
        scores = [job["score"] for job in jobs]
        self.assertEqual(scores, sorted(scores, reverse=True))
        for job in jobs:
            self.assertIn("roleId", job)
            self.assertIn("score", job)
            self.assertIsInstance(job["topApplicant"], bool)
            self.assertIn("id", job)  # carries the real posting fields
            self.assertIn("company", job)

    def test_top_applicant_flag_tracks_threshold(self):
        jobs = rank_top_applicant_jobs(profile(["Python", "Machine Learning", "Data Analysis", "AWS"]), ROLES, limit=50)
        for job in jobs:
            self.assertEqual(job["topApplicant"], job["score"] >= TOP_APPLICANT_THRESHOLD)

    def test_finance_skills_surface_finance_postings_above_unrelated(self):
        jobs = rank_top_applicant_jobs(
            profile(["Corporate Finance", "Financial Modeling", "Investing", "Economics", "Accounting"]),
            ROLES,
            limit=10,
        )
        top_role_ids = {job["roleId"] for job in jobs[:5]}
        finance_role_ids = {rid for rid, role in ROLES.items() if "Finance" in role["industries"]}
        self.assertTrue(top_role_ids & finance_role_ids)

    def test_limit_is_respected(self):
        jobs = rank_top_applicant_jobs(profile(["Python"]), ROLES, limit=3)
        self.assertLessEqual(len(jobs), 3)


class TopApplicantHandlerTests(unittest.TestCase):
    def test_handler_returns_jobs_and_total(self):
        response = post_top_applicant_jobs(TopApplicantRequest(userId="user_5329", limit=5))
        self.assertIn("jobs", response)
        self.assertIn("total", response)
        self.assertLessEqual(len(response["jobs"]), 5)
        self.assertGreaterEqual(response["total"], len(response["jobs"]))

    def test_unknown_user_is_404(self):
        with self.assertRaises(HTTPException) as error:
            post_top_applicant_jobs(TopApplicantRequest(userId="nope"))
        self.assertEqual(error.exception.status_code, 404)

    def test_override_changes_ranking_without_seed_mutation(self):
        baseline = post_top_applicant_jobs(TopApplicantRequest(userId="user_2340", limit=10))
        overridden = post_top_applicant_jobs(
            TopApplicantRequest(userId="user_2340", limit=10, profileOverride={"skills": ["Corporate Finance", "Financial Modeling", "Investing", "Economics", "Accounting"]})
        )
        # Ranking shifts under the override...
        self.assertNotEqual(
            [job["id"] for job in baseline["jobs"]],
            [job["id"] for job in overridden["jobs"]],
        )
        # ...but the seed profile is untouched on a fresh request.
        after = post_top_applicant_jobs(TopApplicantRequest(userId="user_2340", limit=10))
        self.assertEqual([job["id"] for job in baseline["jobs"]], [job["id"] for job in after["jobs"]])

    def test_default_limit_is_25(self):
        response = post_top_applicant_jobs(TopApplicantRequest(userId="user_5329"))
        self.assertLessEqual(len(response["jobs"]), 25)


if __name__ == "__main__":
    unittest.main()
