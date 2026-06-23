import courses from '../../sample_data/course_data.json'
import jobs from '../../sample_data/jobs_data.json'
import users from '../../sample_data/user_data.json'

const jobsById = new Map(jobs.map((job) => [job.id, job]))
const courseById = new Map(courses.map((course) => [course.id, course]))

export const activeProfile = users.find((user) => (
  user.current_location === 'San Francisco, CA'
  && user.skills.includes('Python')
  && user.skills.includes('Data Analysis')
))

const queryTerms = {
  'Data Scientist': ['ai', 'data', 'machine learning', 'ml', 'research', 'analytics'],
  'Software Engineer': ['code', 'coding', 'software', 'build', 'technical', 'engineer'],
  'DevOps Engineer': ['cloud', 'systems', 'infrastructure', 'devops', 'technical'],
  'Product Manager': ['people', 'product', 'startup', 'business', 'strategy', 'ideas'],
  'UX Designer': ['creative', 'design', 'psychology', 'people', 'experience'],
  'Marketing Specialist': ['creative', 'marketing', 'writing', 'brand', 'growth'],
  'Financial Analyst': ['finance', 'money', 'investing', 'business', 'analysis'],
  'Sales Representative': ['people', 'communication', 'customer', 'sales', 'startup'],
  'HR Coordinator': ['people', 'psychology', 'culture', 'team', 'help'],
  'Customer Service Manager': ['people', 'help', 'customer', 'communication', 'service'],
}

function normalize(value) {
  return value.toLowerCase().trim()
}

function overlap(left, right) {
  const rightSkills = new Set(right.map(normalize))
  return left.filter((skill) => rightSkills.has(normalize(skill)))
}

function userHasRole(user, title) {
  return user.job_history.some((jobId) => jobsById.get(jobId)?.position === title)
}

function mostCommonSkills(roleModels) {
  const counts = new Map()
  roleModels.forEach((user) => {
    user.skills.forEach((skill) => {
      const key = normalize(skill)
      counts.set(key, { label: skill, count: (counts.get(key)?.count || 0) + 1 })
    })
  })

  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 6)
    .map((entry) => entry.label)
}

function scoreQuery(title, message) {
  const text = normalize(message)
  const matches = (queryTerms[title] || []).filter((term) => text.includes(term)).length
  return Math.min(matches * 10, 25)
}

function courseForSkills(missingSkills) {
  const missing = new Set(missingSkills.map(normalize))
  return courses
    .map((course) => ({ course, coverage: course.skills.filter((skill) => missing.has(normalize(skill))).length }))
    .filter(({ coverage }) => coverage > 0)
    .sort((left, right) => right.coverage - left.coverage || left.course.name.localeCompare(right.course.name))[0]?.course
}

function pathSummary(model) {
  const previousRoles = model.job_history
    .map((jobId) => jobsById.get(jobId)?.position)
    .filter(Boolean)
    .slice(0, 2)

  return previousRoles.length
    ? `${model.current_location} · experience in ${previousRoles.join(' and ')}`
    : `${model.current_location} · profile with similar skills`
}

export function matchCareers(message) {
  const currentSkills = activeProfile.skills
  const positions = [...new Set(jobs.map((job) => job.position))]

  return positions
    .map((title) => {
      const roleModels = users.filter((user) => userHasRole(user, title))
      const roleSkills = mostCommonSkills(roleModels)
      const matchingSkills = overlap(currentSkills, roleSkills)
      const missingSkills = roleSkills.filter((skill) => !matchingSkills.map(normalize).includes(normalize(skill)))
      const closestModel = [...roleModels]
        .map((model) => ({ model, sharedSkills: overlap(currentSkills, model.skills).length }))
        .sort((left, right) => right.sharedSkills - left.sharedSkills)[0]?.model
      const course = courseForSkills(missingSkills)
      const skillScore = roleSkills.length ? Math.round((matchingSkills.length / roleSkills.length) * 65) : 0
      const localScore = closestModel?.current_location === activeProfile.current_location ? 10 : 0
      const readiness = Math.min(94, Math.max(28, skillScore + scoreQuery(title, message) + localScore))

      return {
        title,
        readiness,
        currentSkills: matchingSkills.slice(0, 3),
        missingSkills: missingSkills.slice(0, 3),
        roleModelCount: roleModels.length,
        person: closestModel?.name || 'LinkedIn member',
        path: closestModel ? pathSummary(closestModel) : 'Similar profile in the sample data',
        initials: closestModel?.name.split(' ').map((name) => name[0]).join('').slice(0, 2) || 'LI',
        course: course ? `${course.name} · ${course.length.value} ${course.length.unit}` : 'Explore courses in this skill area',
        matchReason: matchingSkills.length
          ? `${matchingSkills.length} skills already overlap with people who have held this role.`
          : 'This is a discovery match based on your message; it opens a new skill neighborhood.',
      }
    })
    .sort((left, right) => right.readiness - left.readiness)
    .slice(0, 3)
}

export function profileCourses() {
  return activeProfile.courses
    .map((courseId) => courseById.get(courseId)?.name)
    .filter(Boolean)
    .slice(0, 2)
}
