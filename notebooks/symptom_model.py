import pandas as pd
import pickle

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from xgboost import XGBClassifier

# Load Dataset
df = pd.read_csv(
    "datasets/disease_symptoms/Training.csv"
)

# Features and Target
X = df.drop("prognosis", axis=1)

y = df["prognosis"]

# Encode Diseases
le = LabelEncoder()

y = le.fit_transform(y)

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

# Train
model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.1,
    objective="multi:softprob",
    eval_metric="mlogloss"
)

model.fit(X_train, y_train)

# Predict
pred = model.predict(X_test)

print("\nAccuracy:")
print(
    accuracy_score(y_test, pred)
)

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        pred
    )
)

# Save
pickle.dump(
    model,
    open(
        "models/symptom_model.pkl",
        "wb"
    )
)

pickle.dump(
    le,
    open(
        "models/symptom_encoder.pkl",
        "wb"
    )
)

print("\nModel Saved.")