# src/backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive()
            # Process and display the data here
            # For example, print the data to the console
            print(data)
            if data["type"] == "websocket.disconnect":
                print("Client disconnected event received")
                break

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Connection closed: {e}")


# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# from typing import List
#
# app = FastAPI()
#
# class ConnectionManager:
#     def __init__(self):
#         self.active_connections: List[WebSocket] = []
#
#     async def connect(self, websocket: WebSocket):
#         await websocket.accept()
#         self.active_connections.append(websocket)
#
#     def disconnect(self, websocket: WebSocket):
#         self.active_connections.remove(websocket)
#
#     async def send_audio_to_clients(self, data: str):
#         for connection in self.active_connections:
#             await connection.send_text(data)
#
# manager = ConnectionManager()
#
# @app.websocket("/ws/twilio")
# async def websocket_twilio_endpoint(websocket: WebSocket):
#     await manager.connect(websocket)
#     try:
#         while True:
#             data = await websocket.receive_text()
#             await manager.send_audio_to_clients(data)
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)
#     except Exception as e:
#         print(f"Error: {e}")
#     finally:
#         await websocket.close()
#
# @app.websocket("/ws/client")
# async def websocket_client_endpoint(websocket: WebSocket):
#     await manager.connect(websocket)
#     try:
#         while True:
#             # Keep the client connected, listening for messages
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)
#     finally:
#         await websocket.close()
