const targets = process.argv.slice(2);
if (targets.length === 0) targets.push("https://jerseyquikfix.com");

const fail = (message) => {
  console.error(`Catalog validation failed: ${message}`);
  process.exit(1);
};

const fetchWithRetry = async (url, options) => {
  let response;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      response = await fetch(url, options);
      if (response.ok) return response;
    } catch {
      // Cloudflare custom-domain propagation can briefly lag a version change.
    }
    if (attempt < 6) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return response;
};

for (const rawTarget of targets) {
  const base = new URL(rawTarget);
  const healthResponse = await fetchWithRetry(new URL("/api/health", base), {
    headers: { Accept: "application/json" },
    redirect: "error",
  });
  if (!healthResponse) fail(`${base.origin} health endpoint is unreachable`);
  const healthType = healthResponse.headers.get("content-type") || "";
  if (!healthResponse.ok || !healthType.includes("application/json")) {
    fail(`${base.origin} health endpoint is not healthy JSON`);
  }
  const health = await healthResponse.json();
  if (
    health?.status !== "ok" ||
    health?.ready !== true ||
    !health?.checks?.database ||
    !health?.checks?.products ||
    !health?.checks?.productStorage ||
    !health?.checks?.assets
  ) {
    fail(`${base.origin} health readiness checks did not all pass`);
  }

  const productResponse = await fetchWithRetry(new URL("/api/products?limit=1000", base), {
    headers: { Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
  });
  const productType = productResponse.headers.get("content-type") || "";
  if (!productResponse.ok || !productType.includes("application/json")) {
    fail(`${base.origin} product endpoint is not successful JSON`);
  }
  const productBody = await productResponse.json();
  if (!Array.isArray(productBody?.products) || productBody.products.length === 0) {
    fail(`${base.origin} product catalog is empty`);
  }

  const category = productBody.products.find((product) => product.category)?.category;
  if (category) {
    const categoryUrl = new URL("/api/products", base);
    categoryUrl.searchParams.set("category", category);
    const categoryResponse = await fetchWithRetry(categoryUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
    });
    if (!categoryResponse) fail(`${base.origin} category endpoint is unreachable`);
    const categoryBody = await categoryResponse.json();
    if (
      !categoryResponse.ok ||
      !Array.isArray(categoryBody?.products) ||
      categoryBody.products.length === 0 ||
      categoryBody.products.some((product) => product.category !== category)
    ) {
      fail(`${base.origin} category filtering failed`);
    }
  }

  console.log(
    `${base.origin}: healthy Worker and ${productBody.products.length} active products verified`,
  );
}