import pandas as pd
from sklearn.preprocessing import LabelEncoder
import pickle

df = pd.read_csv("datasets/pad_ufes_20/metadata.csv")

le = LabelEncoder()

df["label"] = le.fit_transform(df["diagnostic"])

print(dict(zip(le.classes_, le.transform(le.classes_))))

with open("models/label_encoder.pkl","wb") as f:
    pickle.dump(le,f)