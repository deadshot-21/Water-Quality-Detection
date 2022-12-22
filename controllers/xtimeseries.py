# import pickle
# import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

import xgboost as xgb
from sklearn.metrics import mean_squared_error
color_pal = sns.color_palette()
plt.style.use('fivethirtyeight')

import tensorflow as tf
# # import statistics
# import pandas as pd
# # import statsmodels as sm
# from statsmodels.tsa.api import VAR
import warnings 
warnings.filterwarnings('ignore')

# with open(r"model.pkl", "rb") as input_file:
#   m = pickle.load(input_file)
m = tf.keras.models.load_model('../model.pb')
# from load import m
data = pd.read_json('../file.json')
df = data[['bb','W','Rrs','rrs','a','aw','bw']]
c=[]
for i in range(len(df)):
  # print(list(pred_data.iloc[i]))
  c.append(m.predict([list(df.iloc[i])],verbose=0)[0][0])
df['C'] = c
df['date'] = data['date']
df = df.set_index('date')
df.index = pd.to_datetime(df.index)
# train = df.loc[df.index < '01-12-2022']
# test = df.loc[df.index >= '01-12-2022']
def create_features(df):
    """
    Create time series features based on time series index.
    """
    df = df.copy()
    df['hour'] = df.index.hour
    df['dayofweek'] = df.index.dayofweek
    df['quarter'] = df.index.quarter
    df['month'] = df.index.month
    df['year'] = df.index.year
    df['dayofyear'] = df.index.dayofyear
    df['dayofmonth'] = df.index.day
    df['weekofyear'] = df.index.isocalendar().week
    return df
df = create_features(df)

# train = create_features(train)
# test = create_features(test)

FEATURES = ['bb','Rrs','a','dayofyear', 'dayofweek', 'year']
TARGET = 'C'

X_train = df[FEATURES]
y_train = df[TARGET]

# X_test = test[FEATURES]
# y_test = test[TARGET]

reg = xgb.XGBRegressor(base_score=0.5, booster='gbtree',    
                       n_estimators=1000,
                       early_stopping_rounds=50,
                       objective='reg:linear',
                       max_depth=3,
                       learning_rate=0.01)
reg.fit(X_train, y_train,
        # eval_set=[(X_train, y_train)],
        verbose=100)
# fi = pd.DataFrame(data=reg.feature_importances_,
#              index=reg.feature_names_in_,
#              columns=['importance'])
# fi.sort_values('importance').plot(kind='barh', title='Feature Importance')
# plt.show()
test['prediction'] = reg.predict(X_test)
df = df.merge(test[['prediction']], how='left', left_index=True, right_index=True)
ax = df[['C']].plot(figsize=(15, 5))
df['prediction'].plot(ax=ax, style='.')
plt.legend(['Truth Data', 'Predictions'])
ax.set_title('Raw Dat and Prediction')
plt.show()
# import numpy as np
# # model = sm.tsa.api.VAR(np.array(df[['C','Rrs','rrs','bb','a']]))
# model = VAR(np.array(df[['C','Rrs','rrs','bb','a']]))
# # model = sm.tsa.vector_ar.var_model.VAR(np.array(df[['C','Rrs','rrs','bb','a']]))
# results = model.fit(maxlags=10, ic='aic')
# print(results.summary())
# # print('np array')
# # print(np.array(df[['C','Rrs','rrs','bb','a']]))
# # print('np array end')
# forecast=[]
# # try:
# forecast = results.forecast(np.array(df[['C','Rrs','rrs','bb','a']]),steps=10)
# # except Exception as e:
# # print(e)
# if len(forecast) != 0:
#   for i in forecast:
#     print(' '.join([str(elem) for elem in list(i)]))
