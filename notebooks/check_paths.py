import pandas as pd
import os

df = pd.read_csv(
    "datasets/pad_ufes_20/train_final.csv"
)

print(df[["image_path","diagnostic"]].head())

print(
    all(
        os.path.exists(p)
        for p in df["image_path"]
    )
)