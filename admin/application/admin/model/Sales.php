<?php

namespace app\admin\model;

use think\Model;

/**
 * 销售人员（小程序同步）
 */
class Sales extends Model
{
    protected $name = 'sales';

    protected $autoWriteTimestamp = 'int';
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';

    protected $append = ['company_name'];

    /**
     * 关联公司
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
        if (empty($data['company_id'])) {
            return '';
        }
        $c = Company::get($data['company_id']);
        return $c ? $c->name : '';
    }
}
