<?php

namespace app\admin\controller\company;

use app\common\controller\Backend;
use think\Db;

/**
 * 公司管理
 *
 * @icon fa fa-building
 */
class Company extends Backend
{
    protected $model = null;

    /** 快速搜索字段 */
    protected $searchFields = 'name,contact_name,contact_phone';

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\Company;
    }

    /**
     * 审核通过：更新 fa_company.status，并调用 NestJS API 同步用户与 fa_sales
     */
    public function approve()
    {
        $ids = $this->request->post('ids');
        if (empty($ids)) {
            $this->error(__('Parameter %s can not be empty', 'ids'));
        }
        $id = is_array($ids) ? $ids[0] : $ids;
        $id = (int) $id;

        $row = Db::name('company')->where('id', $id)->find();
        if (!$row) {
            $this->error('公司不存在');
        }
        if (isset($row['status']) && $row['status'] !== 'pending') {
            $this->error('该记录已处理，无需重复审核');
        }

        $apiBase = config('site.api_base_url') ?: 'http://127.0.0.1:3000';
        $url = rtrim($apiBase, '/') . '/partner/approve/' . $id;
        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'timeout' => 10,
            ],
        ]);
        $res = @file_get_contents($url, false, $ctx);
        $data = $res ? json_decode($res, true) : null;
        if ($data && isset($data['code']) && $data['code'] === 200) {
            $this->success('审核通过');
        }
        // API 调用失败时，仅更新 MySQL 中的 status
        Db::name('company')->where('id', $id)->update(['status' => 'approved']);
        $this->success('审核通过（用户同步可能未完成，请检查 API 服务）');
    }

    /**
     * 审核驳回
     */
    public function reject()
    {
        $ids = $this->request->post('ids');
        if (empty($ids)) {
            $this->error(__('Parameter %s can not be empty', 'ids'));
        }
        $id = is_array($ids) ? $ids[0] : $ids;
        $id = (int) $id;

        $row = Db::name('company')->where('id', $id)->find();
        if (!$row) {
            $this->error('公司不存在');
        }
        if (isset($row['status']) && $row['status'] !== 'pending') {
            $this->error('该记录已处理');
        }

        Db::name('company')->where('id', $id)->update(['status' => 'rejected']);
        $this->success('已驳回');
    }
}
