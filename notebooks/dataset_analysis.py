import pandas as pd

df = pd.read_csv("datasets/pad_ufes_20/metadata.csv")

print(df.shape)

print("\nDisease Counts:")
print(df["diagnostic"].value_counts())

print("\nColumns:")
print(df.columns.tolist())