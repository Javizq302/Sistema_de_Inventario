
import pyodbc
from flask import Flask, request, jsonify
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

server = 'DESKTOP-Q7TEO9A'
database = 'InventoryDB'
driver = '{ODBC Driver 17 for SQL Server}'

connection_string = f'DRIVER={driver};SERVER={server};DATABASE={database};Trusted_Connection=yes;'

def get_db_connection():
    conn = pyodbc.connect(connection_string)
    return conn


#Hacer un Merge para que no se dupiquen los items.
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT Id, [Name], Quantity, Price, Category FROM Products")
    products = []
    
    #añadiendo un IF donde si el name, la cantidad y la Categoria es la misma este se sume en vs de hacer un nuevo objeto.

    #si el if identificar que las constante no son la misma == este va a pasar a un else donde estara ese for. 
    for row in cursor.fetchall():
        products.append({
            'id': row[0],
            'name': row[1],
            'quantity': row[2],
            'price': float(row[3]),
            'category': row[4]
        })

    cursor.close()
    conn.close()
    return jsonify(products)
    
@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.get_json()
    name = data.get('name')
    quantity = data.get('quantity')
    price = data.get('price')
    category = data.get('category')

    if not name or not quantity or not price or not category:
        return jsonify({'error': 'Todos los campos son requeridos'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Verificar si el producto ya existe con el mismo nombre, precio y categoría
    cursor.execute("SELECT Id, Quantity FROM Products WHERE [Name] = ? AND Price = ? AND Category = ?", (name, price, category))
    existing_product = cursor.fetchone()

    if existing_product:
        # Si el producto ya existe, sumamos la cantidad
        existing_id = existing_product[0]
        new_quantity = existing_product[1] + quantity
        cursor.execute("UPDATE Products SET Quantity = ? WHERE Id = ?", (new_quantity, existing_id))
        conn.commit()
        message = f"Producto actualizado, nueva cantidad: {new_quantity}"
    else:
        # Si no existe, lo insertamos como un nuevo producto
        cursor.execute("INSERT INTO Products ([Name], [Quantity], [Price], [Category]) VALUES (?, ?, ?, ?)", (name, quantity, price, category))
        conn.commit()
        message = "Producto agregado exitosamente"

    cursor.close()
    conn.close()
    return jsonify({'message': message}), 201


@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Products WHERE Id = ?", (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Producto eliminado exitosamente'}), 200

@app.route('/api/products/<int:id>', methods=['PUT'])
def update_product_quantity(id):
    data = request.get_json()
    quantity_to_delete = data.get('quantityToDelete')

    if quantity_to_delete is None or quantity_to_delete <= 0:
        return jsonify({'error': 'Cantidad inválida'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT Quantity FROM Products WHERE Id = ?", (id,))
    row = cursor.fetchone()

    if row is None:
        return jsonify({'error': 'Producto no encontrado'}), 404

    current_quantity = row[0]

    if quantity_to_delete >= current_quantity:
        cursor.execute("DELETE FROM Products WHERE Id = ?", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Producto eliminado correctamente'}), 200

    new_quantity = current_quantity - quantity_to_delete
    cursor.execute("UPDATE Products SET Quantity = ? WHERE Id = ?", (new_quantity, id))
    conn.commit()

    cursor.close()
    conn.close()
    return jsonify({'message': 'Cantidad actualizada correctamente', 'new_quantity': new_quantity}), 200

if __name__ == '__main__':
    app.run(debug=True)

#cd C:\Users\Nuris Rodriguez\OneDrive\Documents\Sistema de Inventario\backend-inventario
#flask run --host=0.0.0.0 --port=5000
