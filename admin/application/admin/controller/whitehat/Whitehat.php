<?php

namespace app\admin\controller\whitehat;

use app\common\controller\Backend;
use app\admin\model\Whitehat as WhitehatModel;
use think\Db;
use think\exception\PDOException;
use think\exception\ValidateException;
use Exception;

/**
 * 白帽子管理（接单员）
 *
 * @icon fa fa-user-secret
 */
class Whitehat extends Backend
{
    protected $model = null;

    /** 快速搜索字段：姓名、手机号 */
    protected $searchFields = 'name,phone';

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new WhitehatModel;
    }

    /**
     * 添加时自动生成白帽子编号（直接使用带 code 的 params 保存，避免 request 缓存导致 code 未传入）
     */
    public function add()
    {
        if (false === $this->request->isPost()) {
            return $this->view->fetch();
        }
        $params = $this->request->post('row/a');
        if (empty($params)) {
            $this->error(__('Parameter %s can not be empty', ''));
        }
        if (empty($params['code'])) {
            $params['code'] = WhitehatModel::generateNextCode();
        }
        $params = $this->preExcludeFields($params);
        if ($this->dataLimit && $this->dataLimitFieldAutoFill) {
            $params[$this->dataLimitField] = $this->auth->id;
        }
        $result = false;
        Db::startTrans();
        try {
            if ($this->modelValidate) {
                $name = str_replace("\\model\\", "\\validate\\", get_class($this->model));
                $validate = is_bool($this->modelValidate) ? ($this->modelSceneValidate ? $name . '.add' : $name) : $this->modelValidate;
                $this->model->validateFailException()->validate($validate);
            }
            $result = $this->model->allowField(true)->save($params);
            Db::commit();
        } catch (ValidateException|PDOException|Exception $e) {
            Db::rollback();
            $this->error($e->getMessage());
        }
        if ($result === false) {
            $this->error(__('No rows were inserted'));
        }
        $this->success();
    }
}
