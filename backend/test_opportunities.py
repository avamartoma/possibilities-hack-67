import unittest
from .opportunities import OPPORTUNITIES, rank_opportunities

class OpportunityTests(unittest.TestCase):
    def test_catalog_has_300_fictional_shaped_records(self):
        self.assertEqual(len(OPPORTUNITIES), 300)
        self.assertEqual(len({item['id'] for item in OPPORTUNITIES}), 300)
        for item in OPPORTUNITIES:
            self.assertEqual(set(item), {'id', 'name', 'organization', 'type', 'desc', 'eligibility', 'skills', 'category'})
            self.assertTrue(item['id'].startswith('demo_'))
            self.assertEqual(len(item['skills']), 3)

    def test_ranking_is_deterministic_and_reports_skill_sets(self):
        profile = {'skills': ['Programming', 'Software']}
        first = rank_opportunities(profile, 12)
        self.assertEqual(first, rank_opportunities(profile, 12))
        self.assertEqual(len(first), 12)
        self.assertGreaterEqual(first[0]['fit'], first[-1]['fit'])
        self.assertIn('matchedSkills', first[0])
        self.assertIn('missingSkills', first[0])

    def test_limit_is_respected(self):
        self.assertEqual(len(rank_opportunities({'skills': []}, 1)), 1)
