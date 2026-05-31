from __future__ import print_function

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server')))


import grpc
import users_pb2
import users_pb2_grpc


def run():
    print("Will try to get users ...")
    response = []
    with grpc.insecure_channel("localhost:50051") as channel:
        stub = users_pb2_grpc.UsersStub(channel)
        response = stub.GetUsers(users_pb2.GetUsersRequest(id=1))
    print(response.users)


if __name__ == "__main__":
    run()