function searchPlacesMock() {
  return [
    {
      place_id: "mock_place_1",
      name: "Empresa Fictícia 1",
    },
    {
      place_id: "mock_place_2",
      name: "Empresa Fictícia 2",
    },
    {
      place_id: "mock_place_3",
      name: "Empresa WhatsApp",
    },
  ];
}

function getPlaceDetailsMock(placeId) {
  const mocks = {
    mock_place_1: {
      name: "Empresa Fictícia 1",
      formatted_phone_number: "(11) 1111-1111",
      website: "https://www.empresa1.com.br",
      rating: 4.5,
    },
    mock_place_2: {
      name: "Empresa Fictícia 2",
      formatted_phone_number: "(11) 2222-2222",
      rating: 3.9,
    },
    mock_place_3: {
      name: "Empresa WhatsApp",
      formatted_phone_number: "(11) 93333-3333",
      website: "https://wa.me/5511933333333",
      rating: 4.7,
    },
  };

  if (!mocks[placeId]) {
    throw new Error("ID de local desconhecido no mock");
  }

  return mocks[placeId];
}

module.exports = {
  searchPlacesMock,
  getPlaceDetailsMock,
};
