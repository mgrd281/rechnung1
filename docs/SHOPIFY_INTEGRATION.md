# Shopify Integration Guide: Product Reviews

Follow these steps to display star ratings on your Shopify product pages.

## 1. Add the Widget Script

First, you need to add the script that powers the reviews to your theme.

1.  Go to your **Shopify Admin**.
2.  Navigate to **Online Store > Themes**.
3.  Click the **...** (three dots) button next to your current theme and select **Edit code**.
4.  Open the file `layout/theme.liquid`.
5.  Scroll down to the closing `</body>` tag.
6.  Paste the following line just before `</body>`:

```html
<script src="https://YOUR-APP-URL.vercel.app/review-widget.js" defer></script>
```

> **Note:** Replace `https://YOUR-APP-URL.vercel.app` with the actual URL of your deployed application.

## 2. Display Star Ratings on Product Page

Now, place the stars where you want them to appear (usually under the product title).

1.  In the code editor, search for the file that controls your product page.
    *   **Dawn Theme (and most OS 2.0 themes):** Search for `main-product.liquid` or `price.liquid`.
    *   **Vintage Themes:** Search for `product-template.liquid`.
2.  Find the line of code that displays the product title (usually looks like `<h1>{{ product.title }}</h1>` or similar).
3.  Paste the following code snippet right below the title:

```html
<!-- RechnungsProfi Star Rating -->
<div class="rechnung-profi-stars" data-product-id="{{ product.id }}" style="margin-bottom: 10px;"></div>
```

## 3. Display Star Ratings on Collection Pages (Optional)

To show stars on collection pages (product cards):

1.  Search for the file `card-product.liquid` or `product-card.liquid`.
2.  Find where the price is displayed.
3.  Paste the same code snippet:

```html
<div class="rechnung-profi-stars" data-product-id="{{ card_product.id | default: product.id }}"></div>
```

## 4. Save and Test

1.  Click **Save** in the top right corner.
2.  Visit a product page on your store.
3.  If you have imported reviews for that product in the app, you should now see the star rating!
