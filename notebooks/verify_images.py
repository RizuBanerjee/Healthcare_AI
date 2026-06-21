import os
import pandas as pd

df = pd.read_csv("datasets/pad_ufes_20/metadata.csv")

base = "datasets/pad_ufes_20/images"

found = 0
missing = 0

for img in df["img_id"]:
    image_found = False

    for part in ["imgs_part_1", "imgs_part_2", "imgs_part_3"]:
        path = os.path.join(base, part, img)

        if os.path.exists(path):
            found += 1
            image_found = True
            break

    if not image_found:
        missing += 1

print("Found:", found)
print("Missing:", missing)