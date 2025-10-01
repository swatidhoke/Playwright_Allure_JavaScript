const { test, expect } = require('@playwright/test');


test('POST /huddles/get returns valid huddles with token', async ({ request }) => {
  const AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Imw1QWJJaTlpQmVFVFBkUnhFU1dYayJ9.eyJpc3MiOiJodHRwczovL21wdGVzdGF1dGgubWlzc2lvbnBlYWsudXMvIiwic3ViIjoiYXV0aDB8NjZlYTA4M2E2ZjRhZWYyNDU1ZDM1NzdiIiwiYXVkIjpbImh0dHBzOi8vbXB0ZXN0dWkubWlzc2lvbnBlYWsuYXBwIiwiaHR0cHM6Ly9tcHRlc3RhdXRoLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3NTg5MTMxMzUsImV4cCI6MTc1ODk5OTUzNSwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCIsImF6cCI6InNhT24yZ1NZTXNFQXIwQ1lwVFl6TnROeUpWQ3d6UThMIn0.xJxlNw4RaDZU49OBMb5BudjPN6LWag11NuB1N64rwaTYjP1KcrzhM6LoDTUQoO9LqaUu9i9VrXKeWl3r4Ubw2Cb5fT0dnY8EVhfiYCk6vUe3MrBeRB3l1Ji_hXak-EJQ40AJ7N7h4xP9AebhkRAl--8Sngu80cyXzGkokzsAwRgdRRy31DxBM3mjJq1G_UQqDuaJ3O0jXNt2yA75LuCt1SEyTC1UU-6mwi8Ph0AnfL-ZK5ntvSLEQGGryveVxZ9tt_ON0kjTKrJSn9R5ZVdFdDoBva7GxSlvLFEbpD1-nuAejuKXftyO7w_q0hsVgzb0SlCub1xnhT0JNHTDwhCvZw";
;
  //const AUTH_TOKEN = process.env.AUTH_TOKEN;

  // Fetch new token dynamically
  // const response = await request.post("https://mptestauth.missionpeak.us/oauth/token", {
  // headers: {
  //   "Content-Type": "application/x-www-form-urlencoded",
  // },
  // form: {
  //   grant_type: "password",
  //   username: process.env.TEST_USERNAME,
  //   password: process.env.TEST_PASSWORD,
 
  // }
  // });
  
  //const AUTH_TOKEN = (await response.json()).access_token;
  //comsole.log("===========TOKEN HERE================" +AUTH_TOKEN)

  // 🔹 Payload
  const payload = {
    startDateFrom: new Date().toISOString(),
    startDateTo: null,
    timeline: "UPCOMING",
    activityType: null,
    participationType: "ALL"
  };

  const baseUrl = "https://mptestapi.missionpeak.us";
  const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  "Content-Type": "application/json"
};
  const params = {
    page: 0, 
    size:20
  }
  const queryString = new URLSearchParams(params).toString();
  // 🔹 API cal
    const getHuddleResponse  =await request.post(
    `${baseUrl}/api/huddles/get?${queryString}` ,
    {
      headers: headers,
      data: payload,
      params: params
    }

  );
  console.log("getHuddleResponse Status Respose.  "+ getHuddleResponse.status())
  // 🔹 Status code validation
  expect(getHuddleResponse.status()).toBe(200);
  const body = await getHuddleResponse.json();
  //console.log("################ RESPONSE BODY ########################");

    // 🔹 High-level validations
console.log("################ High-level validations ########################");
  expect(body).toHaveProperty('content');
  expect(Array.isArray(body.content)).toBe(true);
  expect(body.numberOfElements).toBe(body.content.length);

  // 🔹 Pagination checks
  expect(body.pageable).toHaveProperty('pageNumber');
  expect(body.pageable).toHaveProperty('pageSize');
  expect(body.pageable.pageSize).toBe(20);

  // 🔹 Validate each huddle (content array)
  for (const event of body.content) {
    // Basic required fields
    expect(typeof event.id).toBe('number');
    expect(typeof event.name).toBe('string');
    expect(event.status).toMatch(/ACTIVE|CANCELLED|DRAFT/);
    expect(event.privacy).toMatch(/PUBLIC|PRIVATE/);
    expect(event.paymentMode).toMatch(/PAID|FREE/);

    // Payment validations
    if (event.paymentMode === 'FREE') {
      expect(event.paymentAmount).toBe(0);
    }
    if (event.paymentMode === 'PAID') {
      expect(event.paymentAmount).toBeGreaterThan(0);
      expect(event.paymentCurrency).toBe('USD');
    }

    // Date validations
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    expect(start.getTime()).toBeLessThan(end.getTime());

    // RSVP dates (if present)
    if (event.rsvpStartDateTime && event.rsvpEndDateTime) {
      const rsvpStart = new Date(event.rsvpStartDateTime);
      const rsvpEnd = new Date(event.rsvpEndDateTime);
      expect(rsvpStart.getTime()).toBeLessThanOrEqual(rsvpEnd.getTime());
    }
  }
});