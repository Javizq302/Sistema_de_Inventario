import pyodbc

try:
    conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=DESKTOP-Q7TEO9A;DATABASE=InventoryDB;Trusted_Connection=yes;')
    print("Conexión exitosa a SQL Server")
    conn.close()
except Exception as e:
    print("Error al conectar con SQL Server:", e)
