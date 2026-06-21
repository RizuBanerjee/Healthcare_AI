import os

base = "datasets/pad_ufes_20/images"

count = 0

for root, dirs, files in os.walk(base):
    for file in files:
        if file.lower().endswith((".png",".jpg",".jpeg")):
            count += 1

print("Total Images:", count)