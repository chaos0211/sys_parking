如果要部署，记得将backend 设置为 source Root


整个项目基本完成，但是逻辑不对
车位预约功能等于无效，缺少user用户，这样就不知道是谁预约的
车位预约状态一直是"预约中"，支持3个值'reserving','entered','exited'
入场逻辑为  车位预约-->入场审批(审批拒绝status变为exited）-->车位入场(审批通过status变为entered)---> 支付车费(status变为exited)--> 车位离场
目前车位预约、入场、离场都是手动导入的数据，没有按照入场逻辑进行，后续待优化，项目暂停