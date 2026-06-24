"""Dependency-light regression checks for the shared career logic."""

import json
import unittest
from pathlib import Path

from .fit import compute_fit
from .milestones import build_milestone_plan
from .analysis import aggregate_role_analysis


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


if __name__ == "__main__":
    unittest.main()
