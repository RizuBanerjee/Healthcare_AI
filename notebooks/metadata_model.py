import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
from xgboost import XGBClassifier

df = pd.read_csv("datasets/pad_ufes_20/metadata.csv")

cols = [
    "age",
    "gender",
    "itch",
    "grew",
    "hurt",
    "changed",
    "bleed",
    "elevation",
    "diameter_1",
    "diameter_2",
    "fitspatrick",
    "skin_cancer_history",
    "cancer_history",
    "smoke",
    "drink",
    "region"
]

df = df[cols + ["diagnostic"]].copy()

for c in cols:
    df[c] = df[c].astype(str)

X = pd.get_dummies(df[cols])

pickle.dump(
    X.columns.tolist(),
    open("models/skin_feature_columns.pkl", "wb")
)

le = LabelEncoder()
y = le.fit_transform(df["diagnostic"])

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    objective="multi:softprob",
    eval_metric="mlogloss"
)

model.fit(X_train, y_train)

pred = model.predict(X_test)

print(classification_report(y_test, pred))

pickle.dump(
    model,
    open("models/skin_metadata_model.pkl", "wb")
)

pickle.dump(
    le,
    open("models/skin_metadata_encoder.pkl", "wb")
)

print("Skin metadata model saved.")