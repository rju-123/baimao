<?php

namespace app\admin\controller\coupon;

use app\common\controller\Backend;

/**
 * 优惠券模板管理
 *
 * @icon fa fa-ticket
 */
class Template extends Backend
{
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\CouponTemplate;
    }

    public function edit($ids = null)
    {
        $row = $this->model->get($ids);
        if (!$row) {
            $this->error(__('No Results were found'));
        }
        if ($row->status !== 'not_started') {
            $this->error('仅未开始状态的优惠券可编辑');
        }
        return parent::edit($ids);
    }

    public function del($ids = '')
    {
        $ids = $ids ?: $this->request->param('ids');
        if ($ids) {
            $count = \think\Db::name('coupons')->where('templateId', 'in', $ids)->count();
            if ($count > 0) {
                $this->error('该模板已发放优惠券，不可删除');
            }
        }
        return parent::del($ids);
    }

    /**
     * 发放给公司
     */
    public function allocate($ids = null)
    {
        $row = $this->model->get($ids);
        if (!$row) {
            $this->error(__('No Results were found'));
        }
        if ($this->request->isPost()) {
            $companyId = (int) $this->request->post('companyId');
            $quantity = (int) $this->request->post('quantity');
            if ($companyId <= 0 || $quantity <= 0) {
                $this->error('请选择公司并输入有效数量');
            }
            $allocated = \think\Db::name('coupons')->where('templateId', $row->id)->count();
            $remain = max(0, $row->totalQuantity - $allocated);
            if ($quantity > $remain) {
                $this->error("剩余可发放数量为 {$remain}，请调整数量");
            }
            $validFrom = $row->validFrom;
            $validTo = $row->validTo;
            $now = date('Y-m-d H:i:s');
            $inserts = [];
            for ($i = 0; $i < $quantity; $i++) {
                $inserts[] = [
                    'companyId' => $companyId,
                    'templateId' => $row->id,
                    'userId' => null,
                    'name' => $row->name,
                    'type' => $row->type,
                    'value' => $row->value,
                    'minAmount' => $row->minAmount,
                    'validFrom' => $validFrom,
                    'validTo' => $validTo,
                    'status' => 'available',
                ];
            }
            \think\Db::name('coupons')->insertAll($inserts);
            $this->success('发放成功');
        }
        $companies = \think\Db::name('company')->field('id,name')->order('id')->select();
        $this->assign('row', $row);
        $this->assign('companies', $companies);
        return $this->view->fetch();
    }
}
