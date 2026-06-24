const skills = new Map();

export function registerSkill(skill) {
  skills.set(skill.id, skill);
}

export function getSkill(id) {
  return skills.get(id);
}

export function listSkills() {
  return [...skills.values()];
}
