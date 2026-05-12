export interface UserProfile {
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  carbs: number;
  protein: number;
  fats: number;
}

export const calculateNutrition = (profile: UserProfile): NutritionTargets => {
  const { gender, weightKg, heightCm, age, activityLevel } = profile;

  // Mifflin-St Jeor Equation
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // Activity Factor
  let activityFactor = 1.2;
  switch (activityLevel) {
    case 'sedentary':
      activityFactor = 1.2;
      break;
    case 'light':
      activityFactor = 1.375;
      break;
    case 'moderate':
      activityFactor = 1.55;
      break;
    case 'active':
      activityFactor = 1.725;
      break;
    case 'very_active':
      activityFactor = 1.9;
      break;
  }

  const tdee = Math.round(bmr * activityFactor);

  // Macros
  // Carbs: 50% / 4, Protein: 30% / 4, Fats: 20% / 9
  const carbs = Math.round((tdee * 0.5) / 4);
  const protein = Math.round((tdee * 0.3) / 4);
  const fats = Math.round((tdee * 0.2) / 9);

  return {
    bmr: Math.round(bmr),
    tdee,
    carbs,
    protein,
    fats,
  };
};
