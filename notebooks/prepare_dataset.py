import os
import pandas as pd

base = "datasets/pad_ufes_20/images"

df = pd.read_csv("datasets/pad_ufes_20/metadata.csv")

paths = []

for img in df["img_id"]:

    found = None

    for part in ["imgs_part_1","imgs_part_2","imgs_part_3"]:

        p = os.path.join(base, part, img)

        if os.path.exists(p):
            found = p
            break

    paths.append(found)

df["image_path"] = paths

df.to_csv(
    "datasets/pad_ufes_20/full_dataset.csv",
    index=False
)

print(df[["img_id","image_path","diagnostic"]].head())