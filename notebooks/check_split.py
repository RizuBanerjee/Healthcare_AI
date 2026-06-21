import pandas as pd

for name in ["train","val","test"]:

    df = pd.read_csv(f"datasets/pad_ufes_20/{name}.csv")

    print("\n", name.upper())

    print(df["diagnostic"].value_counts())