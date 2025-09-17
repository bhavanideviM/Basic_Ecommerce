const cart = document.querySelector("nav .cart");
const cartSideBar = document.querySelector(".cart-sidebar");
const closeCart = document.querySelector(".close-cart");
const burger = document.querySelector(".burger");
const menuSidebar = document.querySelector(".menu-sidebar");
const closeMenu = document.querySelector(".close-menu");
const cartItemsTotal = document.querySelector(".cart-items-total"); // Corrected selector
const cartPriceTotal = document.querySelector(".total-amount");
const cartUi = document.querySelector(".cart-sidebar .cart");
const totalDiv = document.querySelector(".total-sum");
const clearBtn = document.querySelector(".clear-cart-btn");
const cartContent = document.querySelector(".cart-content");

let Cart = []; // Use consistent capitalization for the array
let buttonsDOM = []; // Renamed for clarity, remove `let` in getButtons()

cart.addEventListener("click", function(){
    cartSideBar.style.transform = "translate(0%)";
    const bodyOverlay = document.createElement("div");
    bodyOverlay.classList.add("overlay");
    setTimeout(function(){
        document.querySelector("body").append(bodyOverlay);
    }, 300);
});
closeCart.addEventListener("click", function(){
    cartSideBar.style.transform = "translate(100%)";
    const bodyOverlay = document.querySelector(".overlay");
    if(bodyOverlay) {
        document.querySelector("body").removeChild(bodyOverlay);
    }
});

burger.addEventListener("click", function(){
    menuSidebar.style.transform = "translate(0%)"; // Corrected typo: transform
});

closeMenu.addEventListener("click", function(){
    menuSidebar.style.transform = "translate(-100%)"; // Corrected typo: transform
});

class Product{
    async getProduct(){
        try {
            const response = await fetch("products.json");
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            let products = data.items;
            products = products.map(item => {
                const {title, price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title, price, id, image};
            });
            return products;
        } catch (error) {
            console.error("Error fetching products:", error);
            return []; // Return an empty array on error
        }
    }
}

class UI{
    displayProducts(products){
        const p = document.querySelector(".product"); // Move this outside the loop
        if (!p) return; // Add a check in case the element doesn't exist
        p.innerHTML = ''; // Clear previous content
        products.forEach(product => {
            const productDiv = document.createElement("div");
            productDiv.innerHTML = `<div class="product-card">
                                       <img src="${product.image}" alt="product">
                                       <span class="add-to-cart" data-id="${product.id}">
                                           <i class="fa fa-cart-plus fa-1x" style="margin-right:0.1em; font-size:1em;"></i>
                                           Add to Cart
                                       </span>
                                       <div class="product-name">${product.title}</div>
                                       <div class="product-pricing">$${product.price}</div>
                                   </div>`;
            p.appendChild(productDiv.firstElementChild); // Append the inner div directly
        });
    }

    getButtons(){
        const btns = document.querySelectorAll(".add-to-cart");
        buttonsDOM = Array.from(btns); // Use Array.from() to create a new array
        
        btns.forEach((btn => {
            let id = btn.dataset.id;
            let inCart = Cart.find((item) => item.id === id);

            if (inCart) {
                btn.innerHTML = "In Cart";
                btn.disabled = true; // Corrected typo: disabled
                btn.style.pointerEvents = "none";
            }

            btn.addEventListener("click", (e) => {
                e.currentTarget.innerHTML = "In Cart";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.pointerEvents = "none";

                let cartItem = {...Storage.getStorageProducts(id), 'amount': 1};
                Cart.push(cartItem); // Use the global Cart array
                Storage.saveCart(Cart);
                this.setCartValues(Cart);
                this.addCartItem(cartItem);
            });
        }));
    }

    setCartValues(Cart){
        let tempTotal = 0;
        let itemTotal = 0;
        Cart.forEach((item) => { // Using forEach is better for side effects
            tempTotal += item.price * item.amount;
            itemTotal += item.amount;
        });
        cartItemsTotal.textContent = itemTotal;
        cartPriceTotal.textContent = tempTotal.toFixed(2); // Corrected typo: toFixed
    }

    addCartItem(cartItem){
        let cartItemUi = document.createElement("div");
        cartItemUi.classList.add("cart-product");
        cartItemUi.innerHTML = `
            <div class="product-image">
                <img src="${cartItem.image}" alt="product">
            </div>
            <div class="cart-product-content">
                <div class="cart-product-name"><h3>${cartItem.title}</h3></div>
                <div class="cart-product-price"><h3>$${cartItem.price.toFixed(2)}</h3></div>
                <a class="cart-product-remove" data-id="${cartItem.id}" href="#" style="color:red;">remove</a>
            </div>
            <div class="plus-minus">
                <span class="decrease-item" data-id="${cartItem.id}">&lt;</span>
                <span class="no-of-items">${cartItem.amount}</span>
                <span class="increase-item" data-id="${cartItem.id}">&gt;</span>
            </div>`;
        cartContent.appendChild(cartItemUi);
    }
    
    setupApp(){
        Cart = Storage.getCart();
        this.setCartValues(Cart);
        Cart.forEach((item) => {
            this.addCartItem(item);
        });
    }

    cartLogic(){
        clearBtn.addEventListener("click", () => {
            this.clearCart();
        });

        cartContent.addEventListener("click", (event) => {
            if (event.target.classList.contains("cart-product-remove")) {
                let id = event.target.dataset.id;
                this.removeItem(id);
                event.target.closest(".cart-product").remove();
            } else if (event.target.classList.contains("increase-item")) {
                let id = event.target.dataset.id;
                let item = Cart.find((item) => item.id === id);
                item.amount++;
                Storage.saveCart(Cart);
                this.setCartValues(Cart);
                event.target.previousElementSibling.textContent = item.amount;
            } else if (event.target.classList.contains("decrease-item")) {
                let id = event.target.dataset.id;
                let item = Cart.find((item) => item.id === id);
                if (item.amount > 1) {
                    item.amount--;
                    Storage.saveCart(Cart);
                    this.setCartValues(Cart);
                    event.target.nextElementSibling.textContent = item.amount;
                } else {
                    this.removeItem(id);
                    event.target.closest(".cart-product").remove();
                }
            }
        });
    }

    clearCart(){
        let cartItems = Cart.map(item => item.id);
        cartItems.forEach((id) => this.removeItem(id));
        
        while (cartContent.firstChild) {
            cartContent.removeChild(cartContent.firstChild);
        }
        
        this.setCartValues(Cart);
    }

    removeItem(id){
        Cart = Cart.filter((item) => item.id !== id);
        this.setCartValues(Cart);
        Storage.saveCart(Cart);
        let button = this.getSingleButton(id);
        if(button) {
            button.style.pointerEvents = "unset";
            button.innerHTML = `<i class="fa fa-cart-plus"></i>Add to Cart`;
            button.style.color = ""; // Reset color
        }
    }

    getSingleButton(id){
        let btn;
        buttonsDOM.forEach((button) => {
            if (button.dataset.id === id) {
                btn = button;
            }
        });
        return btn;
    }
}
class Storage{
    static saveProducts(products){
        localStorage.setItem("products", JSON.stringify(products));
    }
    static getStorageProducts(id){
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find((item) => item.id === id);
    }
    static saveCart(Cart){
        localStorage.setItem('Cart', JSON.stringify(Cart));
    }
    static getCart(){
        return localStorage.getItem('Cart') ? JSON.parse(localStorage.getItem("Cart")) : [];
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const products = new Product();
    const ui = new UI();
    ui.setupApp();
    products.getProduct().then(products => {
        ui.displayProducts(products);
        Storage.saveProducts(products);
    }).then(() => {
        ui.getButtons();
        ui.cartLogic();
    });
});