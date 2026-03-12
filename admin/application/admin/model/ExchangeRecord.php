<?php

namespace app\admin\model;

use think\Model;

/**
 * 积分兑换记录
 */
class ExchangeRecord extends Model
{
    // 表名
    protected $name = 'exchange_records';

    // 关闭时间戳，当前表使用 MySQL datetime
    protected $autoWriteTimestamp = false;
}

