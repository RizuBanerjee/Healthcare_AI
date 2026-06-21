import pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_csv("datasets/pad_ufes_20/metadata.csv")

train_df, temp_df = train_test_split(
    df,
    test_size=0.2,
    stratify=df["diagnostic"],
    random_state=42
)

val_df, test_df = train_test_split(
    temp_df,
    test_size=0.5,
    stratify=temp_df["diagnostic"],
    random_state=42
)

train_df.to_csv("datasets/pad_ufes_20/train.csv", index=False)
val_df.to_csv("datasets/pad_ufes_20/val.csv", index=False)
test_df.to_csv("datasets/pad_ufes_20/test.csv", index=False)

print("Train:", len(train_df))
print("Validation:", len(val_df))
print("Test:", len(test_df))