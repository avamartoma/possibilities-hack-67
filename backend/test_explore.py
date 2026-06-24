import unittest
from .comparison import recommend_exploratory_roles

def role(ident, name, skills, industry):
    return {'id': ident, 'name': name, 'skills': skills, 'coreSkills': skills, 'industries': [industry], 'category': industry, 'description': '', 'jobCount': 1}

class ExploreBreadthTests(unittest.TestCase):
    def test_excludes_high_fit_and_is_deterministic(self):
        roles = {'data_scientist': role('data_scientist', 'Data Scientist', ['Python'], 'Technology'), 'ux_designer': role('ux_designer', 'UX Designer', ['Design'], 'Design')}
        results = recommend_exploratory_roles({'skills': ['Python']}, roles, 12)
        self.assertEqual([item['role']['id'] for item in results], ['ux_designer'])
        self.assertEqual(results[0]['exploreReason'], 'New industry: Design')

    def test_limit_is_respected(self):
        roles = {f'r{i}': role(f'r{i}', f'Role {i}', [f'Skill {i}'], 'Design') for i in range(30)}
        self.assertEqual(len(recommend_exploratory_roles({'skills': []}, roles, 5)), 5)
