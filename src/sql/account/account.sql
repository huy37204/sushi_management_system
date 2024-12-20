CREATE PROCEDURE getUserIdByAccount 
    @USERNAME NVARCHAR(50)
AS
BEGIN
    SELECT 
		AC.PASSWORD,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN AC.EMPLOYEE_ID
            ELSE AC.CUSTOMER_ID 
        END AS Id,
        AC.ROLE,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN E.FULL_NAME
            ELSE C.FULL_NAME
        END AS Name
    FROM ACCOUNT AC
    LEFT JOIN EMPLOYEE E ON AC.EMPLOYEE_ID = E.EMPLOYEE_ID
    LEFT JOIN CUSTOMER C ON AC.CUSTOMER_ID = C.CUSTOMER_ID
    WHERE AC.USERNAME = @USERNAME 
END
GO
CREATE PROCEDURE getMembershipCardInfo
    @CustomerID CHAR(7) -- Thay đổi kiểu dữ liệu cho phù hợp
AS
BEGIN
    SELECT *
    FROM MEMBERSHIP_CARD MC
    WHERE MC.CUSTOMER_ID = @CustomerID; -- So sánh trực tiếp, không chuyển đổi kiểu
END



EXEC getUserIdByAccount @USERNAME = 'mark64'


