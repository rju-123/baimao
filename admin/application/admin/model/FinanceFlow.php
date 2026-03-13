<?php

namespace app\admin\model;

use think\Model;

/**
 * 财务流水
 */
class FinanceFlow extends Model
{
    // 表名（FastAdmin 会自动加前缀 fa_）
    protected $name = 'finance_flows';

    // 使用整型时间戳
    protected $autoWriteTimestamp = 'int';

    // 开启时间戳字段
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    /**
     * 类型列表
     */
    public function getTypeList()
    {
        return [
            'receivable' => '应收',
            'payable'    => '应付',
        ];
    }

    /**
     * 状态列表
     */
    public function getStatusList()
    {
        return [
            'pending'  => '未结算',
            'settled'  => '已结算',
        ];
    }
}

