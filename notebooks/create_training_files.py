import pandas as pd

full_df = pd.read_csv(
    "datasets/pad_ufes_20/full_dataset.csv"
)

for split in ["train","val","test"]:

    split_df = pd.read_csv(
        f"datasets/pad_ufes_20/{split}.csv"
    )

    merged = split_df.merge(
        full_df[["img_id","image_path"]],
        on="img_id"
    )

    merged.to_csv(
        f"datasets/pad_ufes_20/{split}_final.csv",
        index=False
    )

    print(split, merged.shape)