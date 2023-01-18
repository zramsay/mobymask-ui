import { useState, useEffect } from "react";
import cn from "classnames";
import Button from "../components/Button";
import TableList from "../components/TableList";
function MyInviteesReportHistory() {
  const [active, setActive] = useState(1);
  const [tabList, setTabList] = useState([]);

  const isChallengedHeader =
    active === 3
      ? [
          {
            key: "status",
            title: "Report Status",
          },
          {
            key: "Reporter",
            title: "Reporter",
          },
          {
            key: "ParentInviter",
            title: "Parent Inviter",
          },
          {
            key: "Challenger",
            title: "Challenger",
          },
        ]
      : [
          {
            key: "type",
            title: "Type",
          },
          {
            key: "date",
            title: "Report Date",
          },
          {
            key: "Reporter",
            title: "Reporter",
          },
          {
            key: "ParentInviter",
            title: "Parent Inviter",
          },
        ];

  const tableHeader = [
    {
      key: "name",
      title: "Name",
    },

    ...isChallengedHeader,
  ];

  useEffect(() => {
    if (active === 3) {
      setTabList([
        {
          name: "GaliBrata1",
          type: "Twitter",
          status: "bob",
          Reporter: "Jane",
          ParentInviter: "Jane",
          ParentInviter: "Jane",
        },
        {
          name: "GaliBrata1",
          type: "Twitter",
          status: "bob",
          Reporter: "Jane",
          ParentInviter: "Jane",
          Challenger: "Jane",
        },
        {
          name: "GaliBrata1",
          type: "Twitter",
          status: "bob",
          Reporter: "Jane",
          ParentInviter: "Jane",
          Challenger: "Jane",
        },
      ]);
    } else {
      setTabList([
        {
          name: "GaliBrata1",
          type: "Twitter",
          Reporter: "bob",
          date: "2022-10-22",
          ParentInviter: "Jane",
        },
        {
          name: "GaliBrata1",
          type: "Twitter",
          Reporter: "bob",
          date: "2022-10-22",
          ParentInviter: "Jane",
        },
        {
          name: "GaliBrata1",
          type: "Twitter",
          Reporter: "bob",
          date: "2022-10-22",
          ParentInviter: "Jane",
        },
      ]);
    }
  }, [active]);

  return (
    <div className={cn("pt-[77px]")}>
      <h3 className={cn("text-[16px] mb-[24px]")}>
        My invitees' report history
      </h3>
      <p>
        <Button
          {...{
            label: "Reported phisher",
            active: active === 1,
            onClick: () => setActive(1),
          }}
        />
        <Button
          {...{
            label: "Reported not phisher",
            active: active === 2,
            className: "mx-[8px]",
            onClick: () => setActive(2),
          }}
        />
        <Button
          {...{
            label: "Challenged",
            active: active === 3,
            onClick: () => setActive(3),
          }}
        />
      </p>
      <div className={cn(" py-[32px]")}>
        <TableList {...{ tableHeader, tabList }} />
      </div>
    </div>
  );
}

export default MyInviteesReportHistory;
