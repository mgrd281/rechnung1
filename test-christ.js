async function test() {
  const url = 'https://www.christ.de/product/40007335/christ-damenring-89112672/index.html';
  const response = await fetch('http://localhost:3000/api/products/import/external', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
