<?php

namespace app\admin\model;

use think\Model;

/**
 * 优惠券模板
 */
class CouponTemplate extends Model
{
    protected $name = 'coupon_templates';

    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    protected static function init()
    {
        self::beforeInsert(function ($model) {
            if (empty($model->code)) {
                $last = (new self)->order('id', 'desc')->find();
                $num = $last ? (int) preg_replace('/\D/', '', $last->code) + 1 : 1;
                $model->code = 'CPN' . str_pad((string) $num, 3, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * 将 datetime-local 格式 (YYYY-MM-DDTHH:mm) 转为 MySQL datetime
     */
    public function setValidFromAttr($value)
    {
        return $this->normalizeDatetimeLocal($value);
    }

    public function setValidToAttr($value)
    {
        return $this->normalizeDatetimeLocal($value);
    }

    private function normalizeDatetimeLocal($value)
    {
        if (empty($value)) {
            return $value;
        }
        if (strpos($value, 'T') !== false) {
            return str_replace('T', ' ', substr($value, 0, 16)) . ':00';
        }
        return $value;
    }
}
