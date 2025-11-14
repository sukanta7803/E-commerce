document.addEventListener('DOMContentLoaded', () => {
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const productId = e.currentTarget?.dataset?.productId;
      if (!productId) {
        console.warn('add-to-cart clicked but no data-product-id found on the button');
        return;
      }
      addToCart(productId, 1);
    });
  });
});

async function addToCart(productId, quantity = 1) {
  try {
    const response = await fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId, quantity })
    });

    const data = await response.json();

    if (data.success) {
      alert('Product added to cart!');

      const cartCountElement = document.querySelector('.cart-count');
      if (cartCountElement) {
        cartCountElement.textContent = data.cartItemCount;
      } else {
        const cartLink = document.querySelector('.cart-link');
        if (cartLink) {
          const countSpan = document.createElement('span');
          countSpan.className = 'cart-count';
          countSpan.textContent = data.cartItemCount;
          cartLink.appendChild(countSpan);
        }
      }
    } else {
      alert(data.message || 'Failed to add product to cart');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

async function updateCartItem(itemId, quantity) {
  if (quantity < 1) {
    return removeCartItem(itemId);
  }

  try {
    const response = await fetch('/cart/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId, quantity })
    });

    const data = await response.json();

    if (data.success) {
      location.reload();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

async function removeCartItem(itemId) {
  if (!confirm('Remove this item from cart?')) return;

  try {
    const response = await fetch(`/cart/remove/${itemId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      location.reload();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

async function addToWishlist(productId) {
  try {
    const response = await fetch('/user/wishlist/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });

    const data = await response.json();

    if (data.success) {
      alert('Added to wishlist!');
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

function changeMainImage(imageUrl) {
  const mainImage = document.getElementById('mainImage');
  if (mainImage) {
    mainImage.src = imageUrl;
  }
}

async function submitReview(event, productId) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const data = {
    productId,
    rating: formData.get('rating'),
    title: formData.get('title'),
    comment: formData.get('comment')
  };

  try {
    const response = await fetch('/reviews/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      alert('Review submitted successfully!');
      location.reload();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

async function markHelpful(reviewId) {
  try {
    const response = await fetch(`/reviews/${reviewId}/helpful`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      location.reload();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}