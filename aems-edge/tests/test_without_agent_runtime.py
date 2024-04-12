from manager.main_manager import ManagerProxy


def test_manager_proxy(manager_proxy: ManagerProxy):

    assert manager_proxy is not None
    assert isinstance(manager_proxy, ManagerProxy)
