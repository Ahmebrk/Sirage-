# Algeria wilaya source note

The checkout keeps the user's requested 58-wilaya baseline and uses Arabic names in code order 01–58. The Algerian Interior Ministry reference page confirms the 58-wilaya administrative context in its 2024 training figures, including 58 local administration directors. The cited `othmanus/algeria-cities` dataset states that its 58-wilaya list follows the official Interior Ministry division and provides Arabic data. The current 58-name list was cross-checked against the 01–58 table in the provinces reference.

Sources:

- Ministry of Interior and Local Authorities: http://interieur.gov.dz/%D8%A7%D9%84%D8%AA%D9%83%D9%88%D9%8A%D9%86-%D8%AD%D8%B5%D9%8A%D9%84%D8%A9-2023/
- Arabic wilaya dataset and source note: https://github.com/othmanus/algeria-cities
- Province codes and Arabic names cross-check: https://en.wikipedia.org/wiki/Provinces_of_Algeria

Implementation note: the source page also now discusses later administrative changes, but this project intentionally implements the 58-wilaya scope explicitly requested by the store brief. Delivery coverage is not claimed beyond the selected wilaya; fees are configurable in the protected admin dashboard.
