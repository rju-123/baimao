<?php

namespace app\admin\model;

use think\Model;

/**
 * 积分商城商品
 */
class PointsMallItem extends Model
{
    // 表名
    protected $name = 'points_mall_items';

    // 关闭时间戳，当前表不记录创建/更新时间
    protected $autoWriteTimestamp = false;
}

