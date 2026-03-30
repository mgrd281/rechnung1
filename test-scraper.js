async function test() {
  const url = 'https://www.otto.de/p/boss-chronograph-velocity-1513716-quarzuhr-herrenuhr-643501708/';
  const response = await fetch('http://localhost:3000/api/products/import/external', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
