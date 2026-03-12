<?php

namespace app\admin\model;

use think\Model;
use app\admin\model\Company;
use app\admin\model\Order;

/**
 * 销售人员（小程序同步）
 */
class Sales extends Model
{
    protected $name = 'sales';

    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    protected $append = ['company_name', 'ongoing_orders'];

    /**
     * 关联公司（用于列表展示所属公司名称；在列表中使用 company.name 字段）
     */
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'id');
    }

    /**
     * 列表展示用：所属公司名称
     */
    public function getCompanyNameAttr($value, $data)
    {
        if (!empty($data['company_id'])) {
            $company = Company::get($data['company_id']);
            return $company ? $company->name : '';
        }
        return '';
    }

    /**
     * 进行中订单数：按销售手机号统计
     * 状态范围：待签约 / 待履约 / 履约中
     */
    public function getOngoingOrdersAttr($value, $data)
    {
        if (empty($data['phone'])) {
            return 0;
        }

        return (int)Order::where('sales_phone', $data['phone'])
            ->where('status', 'in', ['pending_contract', 'pending_fulfillment', 'in_progress'])
            ->count();
    }
}
