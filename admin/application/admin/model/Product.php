<?php

namespace app\admin\model;

use think\Model;

class Product extends Model
{
    // 表名（会自动带上表前缀）
    protected $name = 'product';

    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';

    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    // 追加属性（如需枚举文本可在此追加）
    protected $append = [];
}

