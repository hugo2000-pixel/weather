export function getClothingRecommendation(tempC: number, precipProbability: number, uvIndex: number): string {
  let recommendation = "";

  // Temperature
  if (tempC < 0) {
    recommendation += "Wear a heavy winter coat, gloves, a scarf, and a warm hat. ";
  } else if (tempC >= 0 && tempC < 10) {
    recommendation += "Wear a warm coat and layer up. ";
  } else if (tempC >= 10 && tempC < 18) {
    recommendation += "A light jacket or sweater should be fine. ";
  } else if (tempC >= 18 && tempC < 25) {
    recommendation += "Short sleeves or a light shirt are comfortable. ";
  } else {
    recommendation += "Wear light, breathable summer clothing like shorts and a t-shirt. ";
  }

  // Precipitation
  if (precipProbability > 40) {
    recommendation += "Don't forget an umbrella or a raincoat! ";
  }

  // UV Index
  if (uvIndex >= 6) {
    recommendation += "UV index is high, remember your sunglasses and sunscreen.";
  }

  return recommendation.trim();
}
