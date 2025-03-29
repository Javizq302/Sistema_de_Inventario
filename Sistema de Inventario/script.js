document.addEventListener("DOMContentLoaded", () => {
    // Variables del DOM
    const productForm = document.getElementById("product-form");
    const nameInput = document.getElementById("name");
    const quantityInput = document.getElementById("quantity");
    const priceInput = document.getElementById("price");
    const categoryInput = document.getElementById("category");
    const productList = document.getElementById("product-list");
    const searchInput = document.getElementById("search");
    const deleteModal = document.getElementById("delete-modal");
    const confirmDeleteBtn = document.getElementById("confirm-delete");
    const closeModalBtn = document.querySelector(".modal-content .close");
    const deleteQuantityInput = document.getElementById("delete-quantity");
    let currentProductId = null;

    // Listener para el envío del formulario
    productForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const product = {
            name: nameInput.value,
            quantity: parseInt(quantityInput.value, 10),
            price: parseFloat(priceInput.value),
            category: categoryInput.value
        };
        addProduct(product);
    });

    // Función para agregar producto
    async function addProduct(product) {
        try {
            const response = await fetch("http://localhost:5000/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(product)
            });

            const result = await response.json();
            if (response.ok) {
                mostrarMensaje(result.message);
                productForm.reset();
                loadProducts();
            } else {
                mostrarMensaje("Error al agregar producto", true);
            }
        } catch (error) {
            console.error("Error en addProduct:", error);
            mostrarMensaje("Error de conexión con el servidor", true);
        }
    }

    // Función para cargar los productos
    async function loadProducts() {
        try {
            const response = await fetch("http://localhost:5000/api/products");
            const products = await response.json();
            productList.innerHTML = "";
            products.forEach(product => {
                const row = document.createElement("tr");
                row.dataset.id = product.id;
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.quantity}</td>
                    <td>$ ${product.price}</td>
                    <td>${product.category}</td>
                    <td><button class="delete-btn">Eliminar</button></td>
                `;
                productList.appendChild(row);
            });
            // Agregar eventos a los botones de eliminar
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", (e) => {
                    const id = e.target.closest("tr").dataset.id;
                    openDeleteModal(id);
                });
            });
        } catch (error) {
            console.error("Error al cargar productos:", error);
        }
    }

    function mostrarMensaje(texto, tipo = 'success') {
        let mensajeDiv = document.getElementById("mensaje");
        if (!mensajeDiv) {
            mensajeDiv = document.createElement("div");
            mensajeDiv.id = "mensaje";
            document.body.prepend(mensajeDiv);
        }
        mensajeDiv.textContent = texto;

        // Remueve las clases existentes y añade la correspondiente
        mensajeDiv.classList.remove("success", "error", "update");

        mensajeDiv.classList.add(tipo)

        //mensajeDiv.classList.add(esError ? "error" : "success");

        mensajeDiv.style.display = "block";
        mensajeDiv.style.opacity = "1";

        setTimeout(() => {
            mensajeDiv.style.opacity = "0";
            setTimeout(() => {
                mensajeDiv.style.display = "none";
            }, 300);
        }, 3000);
    }

    // Funciones para manejo del modal
    function openDeleteModal(productId) {
        currentProductId = productId;
        if (deleteQuantityInput) {
            deleteQuantityInput.value = "";
        }
        deleteModal.style.display = "block";
    }

    function closeDeleteModal() {
        deleteModal.style.display = "none";
    }

    closeModalBtn.addEventListener("click", closeDeleteModal);

    confirmDeleteBtn.addEventListener("click", () => {
        let quantityToDelete = null;
        if (deleteQuantityInput) {
            quantityToDelete = parseInt(deleteQuantityInput.value, 10);
        }
        if (quantityToDelete && quantityToDelete > 0) {
            updateProductQuantity(currentProductId, quantityToDelete);
        } else {
            deleteProduct(currentProductId);
        }
        closeDeleteModal();
    });

    // Función para eliminar un producto
    async function deleteProduct(productId) {
        try {
            const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (response.ok) {
                mostrarMensaje(result.message);
                loadProducts();
            } else {
                mostrarMensaje("Error al eliminar el producto", true);
            }
        } catch (error) {
            console.error("Error en deleteProduct:", error);
            mostrarMensaje("Error de conexión con el servidor", true);
        }
    }

    // Función para actualizar la cantidad (eliminación parcial)
    async function updateProductQuantity(productId, quantityToDelete) {
        try {
            const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantityToDelete })
            });
            const result = await response.json();
            if (response.ok) {
                mostrarMensaje(result.message, 'update');
                loadProducts();
            } else {
                mostrarMensaje("Error: " + result.error, true);
            }
        } catch (error) {
            console.error("Error en updateProductQuantity:", error);
            mostrarMensaje("Error de conexión con el servidor", true);
        }
    }

    // Función para filtrar productos
    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase();
        document.querySelectorAll("#product-list tr").forEach(row => {
            const productName = row.querySelector("td").textContent.toLowerCase();
            row.style.display = productName.includes(searchTerm) ? "" : "none";
        });
    });

    // Cargar productos al iniciar
    loadProducts();
});